import { api } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Config: defina true para montar relatório somente com /chamado/tecnico/{id}
  const USE_FRONT_ONLY = true;

  const statusMap = { aberto:0, andamento:1, fechado:2, atrasado:3 };
  const statusReverseMap = { 0:"aberto", 1:"andamento", 2:"fechado", 3:"atrasado" };
  const statusColorMap = {
    0:"#0000ff",
    1:"#f29e01",
    2:"#008000",
    3:"#ff0000"
  };
  function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ""; }

  // Recupera id/nome do técnico do armazenamento local (definido no login)
  const tecnicoId = sessionStorage.getItem("tecnicoId") || localStorage.getItem("tecnicoId");
  const tecnicoNome = sessionStorage.getItem("tecnicoNome") || localStorage.getItem("tecnicoNome") || "Técnico";

  const tituloEl = document.getElementById("tecnicoNome");
  if (tituloEl) tituloEl.textContent = `Relatório de ${tecnicoNome}`;

  if (!tecnicoId) {
    mostrarErro("ID do técnico não encontrado no storage.");
    return;
  }

  try {
    if (USE_FRONT_ONLY) {
      // Busca todos os chamados do técnico e gera relatório no front
      const resp = await api.get(`/chamado/tecnico/${tecnicoId}`);
      const todos = Array.isArray(resp.data) ? resp.data
        : Array.isArray(resp.data?.items) ? resp.data.items
        : Array.isArray(resp.data?.content) ? resp.data.content
        : [];
      const relatorio = montarRelatorioFront(todos, tecnicoId);
      preencherRelatorio(relatorio);
    } else {
      // Usa rota de backend já pronta (caso exista futuramente)
      const resp = await api.get(`/relatorios/tecnico/${tecnicoId}`);
      preencherRelatorio(resp.data);
    }
  } catch (e) {
    console.error("Erro carregando dados:", e?.response || e);
    mostrarErro("Falha ao obter dados de chamados.");
  }

  function mostrarErro(msg){
    const el = document.getElementById("erroMsg");
    if (el){
      el.textContent = "⚠️ " + msg;
      el.style.display = "block";
    }
  }

  function montarRelatorioFront(chamados, idTec){
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate()+1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const meus = chamados.filter(c => String(
      c.tecnico?.id || c.idTecnico || c.tecnicoId || ""
    ) === String(idTec));

    const dentroPeriodo = (lista, ini, fim) => lista.filter(c => {
      if (!c.dataAbertura) return false;
      const dt = new Date(c.dataAbertura);
      return dt >= ini && dt < fim;
    });

    const hojeLista = dentroPeriodo(meus, hoje, amanha);
    const mesLista  = dentroPeriodo(meus, inicioMes, amanha);

    const resumoHoje = {
      abertos:   hojeLista.filter(c => c.status === 0).length,
      andamento: hojeLista.filter(c => c.status === 1).length,
      fechados:  hojeLista.filter(c => c.status === 2).length,
      atrasados: hojeLista.filter(c => c.status === 3).length
    };

    const fechadosMes = mesLista.filter(c => c.status === 2).length;
    const tempos = mesLista
      .filter(c => c.status === 2 && c.dataFechamento && c.dataAbertura)
      .map(c => (new Date(c.dataFechamento) - new Date(c.dataAbertura))/3600000);
    const tempoMedio = tempos.length
      ? `${(tempos.reduce((a,b)=>a+b,0)/tempos.length).toFixed(1)}h`
      : "0h";

    // Últimos 7 dias
    const RANGE_DIAS = 7;
    const datas = [], abertos = [], andamento = [], fechados = [], atrasados = [];
    for (let i = RANGE_DIAS - 1; i >= 0; i--) {
      const dia = new Date(hoje); dia.setDate(dia.getDate() - i);
      const dia2 = new Date(dia); dia2.setDate(dia2.getDate() + 1);
      const diaLista = dentroPeriodo(meus, dia, dia2);
      datas.push(dia.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}));
      abertos.push(diaLista.filter(c=>c.status===0).length);
      andamento.push(diaLista.filter(c=>c.status===1).length);
      fechados.push(diaLista.filter(c=>c.status===2).length);
      atrasados.push(diaLista.filter(c=>c.status===3).length);
    }

    return {
      hoje: resumoHoje,
      mes: { fechados: fechadosMes, tempoMedio },
      grafico: { datas, abertos, andamento, fechados, atrasados },
      chamados: meus
    };
  }

  function preencherRelatorio(d){
    if (!d || !d.hoje){ mostrarErro("Dados inválidos."); return; }

    setText("abertosHoje",   d.hoje.abertos);
    setText("andamentoHoje", d.hoje.andamento);
    setText("fechadosHoje",  d.hoje.fechados);
    setText("atrasadosHoje", d.hoje.atrasados);
    setText("totalHoje",
      d.hoje.abertos + d.hoje.andamento + d.hoje.fechados + d.hoje.atrasados
    );
    if (d.mes){
      setText("fechadosMes", d.mes.fechados);
      setText("tempoMedio",  d.mes.tempoMedio);
    }

    const ctx = document.getElementById("graficoChamados")?.getContext("2d");
    if (ctx && d.grafico?.datas){
      const ds = [];
      ds.push(makeDataset("Abertos",   d.grafico.abertos,   statusColorMap[0]));
      ds.push(makeDataset("Andamento", d.grafico.andamento, statusColorMap[1]));
      ds.push(makeDataset("Fechados",  d.grafico.fechados,  statusColorMap[2]));
      ds.push(makeDataset("Atrasados", d.grafico.atrasados, statusColorMap[3]));

      new Chart(ctx,{
        type:"bar",
        data:{ labels:d.grafico.datas, datasets:ds },
        options:{
          responsive:true,
          plugins:{ legend:{position:"top"}, title:{display:true,text:"Chamados por status (7 dias)"} },
          scales:{
            y:{ beginAtZero:true, ticks:{ stepSize:1 }, title:{display:true,text:"Quantidade"} },
            x:{ title:{display:true,text:"Datas"} }
          }
        }
      });
    }

    const listaEl = document.getElementById("listaChamadosTecnico");
    if (listaEl && Array.isArray(d.chamados)){
      listaEl.innerHTML = d.chamados.map(c => {
        const st = cap(statusReverseMap[c.status] || "aberto");
        const prMap = {0:"Baixa",1:"Média",2:"Alta"};
        const pr = c.prioridade!==undefined ? prMap[c.prioridade] : "";
        const dataFmt = c.dataAbertura
          ? new Date(c.dataAbertura).toLocaleDateString("pt-BR")
          : "-";
        return `
          <div class="call-card" data-id="${c.idChamado || c.id}">
            <p><strong>#${c.protocolo || c.id}</strong> - ${c.titulo || "Sem título"}</p>
            <p>${cap(tecnicoNome)} - ${dataFmt}</p>
            <div class="info-line">
              <span class="status ${st.toLowerCase()}">${st}</span>
              ${pr ? `<span class="priority ${pr.toLowerCase()}">${pr}</span>` : ""}
            </div>
          </div>
        `;
      }).join("");
    }
  }

  function makeDataset(label,data,color){
    return {
      label,
      data,
      backgroundColor: color+"99",
      borderColor: color,
      borderWidth:1
    };
  }
  function setText(id,val){
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  window.voltarPainel = () => { window.location.href = "painelTecnico.html"; };
});

