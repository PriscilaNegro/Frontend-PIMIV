import {api} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (sessionStorage.getItem("isAdmin") !== "true") {
    window.location.href = "painelTecnico.html";
    return;
  }

  // Bloqueia voltar no navegador
  window.history.pushState(null, "", window.location.href);
  window.onpopstate = function () {
    sessionStorage.removeItem("isAdmin");
    window.location.href = "painelTecnico.html";
  };

  try {
    // Busca TODOS os chamados
    const response = await api.get("/chamado");
    const todosChamados = response.data;

    // Monta o relatório no front
    const dadosAdmin = montarRelatorioAdmin(todosChamados);
    preencherRelatorio(dadosAdmin);
  } 
  catch (error) {
    console.error("Erro ao carregar chamados:", error);
    const erroMsg = document.getElementById("erroMsg");
    erroMsg.textContent = "⚠️ Não foi possível carregar os dados do relatório. Tente novamente mais tarde.";
    erroMsg.style.display = "block";
  }
});

// Monta relatório do admin a partir de todos os chamados
function montarRelatorioAdmin(chamados) {
  const hoje = new Date(); 
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje); 
  amanha.setDate(amanha.getDate() + 1);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Filtra por data de abertura
  const dentroPeriodo = (lista, ini, fim) => lista.filter(c => {
    if (!c.dataAbertura) return false;
    const dt = new Date(c.dataAbertura);
    return dt >= ini && dt < fim;
  });

  // Filtra por data de fechamento
  const dentroPeriodoFechamento = (lista, ini, fim) => lista.filter(c => {
    if (!c.dataConclusao || c.status !== 2) return false;
    const dt = new Date(c.dataConclusao);
    return dt >= ini && dt < fim;
  });

  const hojeLista = dentroPeriodo(chamados, hoje, amanha);
  const fechadosHoje = dentroPeriodoFechamento(chamados, hoje, amanha).length;
  const totalAndamento = chamados.filter(c => c.status === 1).length;

  // Resumo HOJE
  const resumoHoje = {
    abertos: hojeLista.filter(c => c.status === 0).length,
    andamento: totalAndamento,
    fechados: fechadosHoje,
    atrasados: hojeLista.filter(c => c.status === 3).length
  };

  // Dados do MÊS
  const fechadosMesLista = dentroPeriodoFechamento(chamados, inicioMes, amanha);
  const fechadosMes = fechadosMesLista.length;
  
  const tempos = fechadosMesLista
    .filter(c => c.dataConclusao && c.dataAbertura)
    .map(c => (new Date(c.dataConclusao) - new Date(c.dataAbertura)) / 3600000);
  const tempoMedio = tempos.length
    ? `${(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1)}h`
    : "0h";

  // Gráfico por técnico (fechados no mês)
  const tecnicosMap = {};
  fechadosMesLista.forEach(c => {
    const tecNome = c.tecnico?.nome || "Sem técnico";
    tecnicosMap[tecNome] = (tecnicosMap[tecNome] || 0) + 1;
  });
  const porTecnico = Object.entries(tecnicosMap).map(([tecnico, fechados]) => ({
    tecnico,
    fechados
  }));

  // Gráfico mensal (últimas 4 semanas)
  const semanas = [];
  const chamadosPorSemana = [];
  for (let i = 3; i >= 0; i--) {
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() - (i * 7));
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    
    const fechadosSemana = dentroPeriodoFechamento(chamados, inicioSemana, new Date(fimSemana.getTime() + 86400000)).length;
    
    semanas.push(`${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1} - ${fimSemana.getDate()}/${fimSemana.getMonth() + 1}`);
    chamadosPorSemana.push(fechadosSemana);
  }

  // Gráfico abertos x fechados (últimos 7 dias)
  const datas = [];
  const abertos = [];
  const fechados = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const dia2 = new Date(dia);
    dia2.setDate(dia2.getDate() + 1);

    const diaAbertos = dentroPeriodo(chamados, dia, dia2).length;
    const diaFechados = dentroPeriodoFechamento(chamados, dia, dia2).length;

    datas.push(dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    abertos.push(diaAbertos);
    fechados.push(diaFechados);
  }

  return {
    hoje: resumoHoje,
    mes: { fechados: fechadosMes, tempoMedio },
    porTecnico,
    graficoMensal: { semanas, chamados: chamadosPorSemana },
    graficoAbertosFechados: { datas, abertos, fechados }
  };
}

// Função para preencher relatório 
function preencherRelatorio(dadosAdmin) {
  // Preenche resumo diário
  document.getElementById("abertosHoje").textContent = dadosAdmin.hoje.abertos;
  document.getElementById("andamentoHoje").textContent = dadosAdmin.hoje.andamento;
  document.getElementById("fechadosHoje").textContent = dadosAdmin.hoje.fechados;
  document.getElementById("atrasadosHoje").textContent = dadosAdmin.hoje.atrasados;
  document.getElementById("totalHoje").textContent =
    dadosAdmin.hoje.abertos + dadosAdmin.hoje.andamento +
    dadosAdmin.hoje.fechados + dadosAdmin.hoje.atrasados;

  // Preenche mensais
  document.getElementById("fechadosMes").textContent = dadosAdmin.mes.fechados;
  document.getElementById("tempoMedio").textContent = dadosAdmin.mes.tempoMedio;

  // Gráfico por técnico
  new Chart(document.getElementById("graficoPorTecnico"), {
    type: "bar",
    data: {
      labels: dadosAdmin.porTecnico.map(t => t.tecnico),
      datasets: [{
        label: "Chamados Fechados",
        data: dadosAdmin.porTecnico.map(t => t.fechados),
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Gráfico mensal
  new Chart(document.getElementById("graficoMensal"), {
    type: "line",
    data: {
      labels: dadosAdmin.graficoMensal.semanas,
      datasets: [{
        label: "Chamados Fechados no Mês",
        data: dadosAdmin.graficoMensal.chamados,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Gráfico abertos x fechados
  new Chart(document.getElementById("graficoAbertosFechados"), {
    type: "line",
    data: {
      labels: dadosAdmin.graficoAbertosFechados.datas,
      datasets: [
        {
          label: "Abertos",
          data: dadosAdmin.graficoAbertosFechados.abertos,
          borderColor: "rgba(246, 68, 74, 1)",
          backgroundColor: "rgba(246, 68, 74, 0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Fechados",
          data: dadosAdmin.graficoAbertosFechados.fechados,
          borderColor: "rgba(43, 233, 119, 1)",
          backgroundColor: "rgba(43, 233, 119, 0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// Função voltar
function voltarPainel() {
  window.location.href = "painelTecnico.html";
}
window.voltarPainel = voltarPainel;

// Função exportar PDF
async function exportarPDF() {
  try {
    const response = await api.get("/relatorio/pdf", {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-admin-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showFeedback("PDF exportado com sucesso!", "ok");
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    showFeedback("Erro ao exportar PDF.", "erro");
  }
}

// Função exportar Excel
async function exportarExcel() {
  try {
    const response = await api.get("/relatorio/excel", {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-admin-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showFeedback("Excel exportado com sucesso!", "ok");
  } catch (error) {
    console.error("Erro ao exportar Excel:", error);
    showFeedback("Erro ao exportar Excel.", "erro");
  }
}

// Feedback visual
function showFeedback(msg, tipo = "ok") {
  let msgEl = document.getElementById("feedbackExport");
  if (!msgEl) {
    msgEl = document.createElement("p");
    msgEl.id = "feedbackExport";
    msgEl.style.textAlign = "center";
    msgEl.style.marginTop = "10px";
    msgEl.style.fontSize = ".9rem";
    msgEl.style.fontWeight = "500";
    document.querySelector(".btn-container").appendChild(msgEl);
  }
  msgEl.textContent = msg;
  msgEl.style.color = tipo === "ok" ? "#1f7a31" : "#a12626";
  
  setTimeout(() => {
    msgEl.style.transition = "opacity .6s";
    msgEl.style.opacity = "0";
    setTimeout(() => msgEl.remove(), 600);
  }, 3000);
}

// Expõe funções globalmente
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;