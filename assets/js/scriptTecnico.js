import {api} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  
  // Impede acesso sem login
  if (!sessionStorage.getItem("tecnicoId")) {
    window.location.replace("loginTecnico.html");
    return;
  }

  // Verifica se é admin
  const isAdmin = sessionStorage.getItem("isAdmin") === "true";
  const tecnicoId = sessionStorage.getItem("tecnicoId");
  console.log("tecnicoId:", tecnicoId);

  // Exibir nome do técnico no sidebar
  const profileText = document.querySelector(".profile p");
  function exibirNomeTecnico() {
    let n = localStorage.getItem("tecnicoNome");
    if (n) {
      const badge = isAdmin ? " 🗝️" : "";
      profileText.textContent = `Olá, ${n.charAt(0).toUpperCase() + n.slice(1)}${badge}`;
    }
  }
  exibirNomeTecnico();

  // Referências aos filtros
  const searchInput       = document.querySelector(".topbar input");
  const statusSelect      = document.getElementById("status");
  const prioridadeSelect  = document.getElementById("prioridade");
  const responsavelSelect = document.getElementById("responsavel");
  const callsContainer    = document.querySelector(".calls");

  // Estado
  let chamadosData = [];
  let filteredData = [];
  let currentPage  = 1;
  const itemsPerPage = 5;
  let statusChart = null;

  // Mapeamento de prioridade (backend usa 0, 1, 2)
  const prioridadeMap = {
    "baixa": 0,
    "media": 1,
    "alta": 2
  };
  const prioridadeReverseMap = {
    0: "baixa",
    1: "media",
    2: "alta"
  };

  // Mapeamento de status (backend usa 0, 1, 2, 3)
  const statusMap = {
    "aberto": 0,
    "andamento": 1,
    "fechado": 2,
    "atrasado": 3
  };
  const statusReverseMap = {
    0: "aberto",
    1: "andamento",
    2: "fechado",
    3: "atrasado"
  };
  const statusColorMap = {
    0: "#0000ff",   // aberto
    1: "#f29e01",   // andamento
    2: "#008000",   // fechado
    3: "#ff0000"    // atrasado
  };

  // Carrega técnicos para o select (responsáveis)
  async function carregarTecnicos() {
    if (!responsavelSelect) return;
    
    try {
      if (!isAdmin) {
        // Técnico comum: mostra apenas ele mesmo
        const tecnicoNome = localStorage.getItem("tecnicoNome") || "Você";
        responsavelSelect.innerHTML = `<option value="${tecnicoId}" selected>${tecnicoNome}</option>`;
        responsavelSelect.disabled = true; // desabilita para evitar alteração
        return;
      }

      // Admin: carrega todos os técnicos
      console.log("Buscando técnicos...");
      const resp = await api.get("/tecnico");
      console.log("Resposta /tecnico:", resp.data);
      const lista = Array.isArray(resp.data) ? resp.data : [];
      responsavelSelect.innerHTML = `<option value="">Todos</option>` +
        lista.map(t => {
          const id = t.id || t.idTecnico;
          const nome = t.nome || t.name || t.login || t.email || `Tec${id}`;
          return `<option value="${id}">${nome}</option>`;
        }).join("");
    } catch (e) {
      console.error("Falha ao carregar técnicos:", e);
    }
  }

  // Normalizações simples - garante sempre string
  function norm(v) { 
    if (v === null || v === undefined) return "";
    return String(v).toLowerCase().trim();
  }

  // Decide rota ótima com base nos filtros individuais
  async function carregarChamadosBackend() {
    const statusTexto      = norm(statusSelect?.value);
    const prioridadeTexto  = norm(prioridadeSelect?.value);
    const responsavelId    = responsavelSelect?.value?.trim() || "";

    const statusNum = statusTexto ? statusMap[statusTexto] : null;
    const prioridadeNum = prioridadeTexto ? prioridadeMap[prioridadeTexto] : null;

    let url;
    
    // Se não for admin, força sempre usar o ID do técnico logado
    const tecnicoFiltro = isAdmin ? responsavelId : tecnicoId;
    
    const filtrosAtivos = [statusNum !== null, prioridadeNum !== null, !!tecnicoFiltro].filter(Boolean).length;

    if (filtrosAtivos === 0) {
      // Admin sem filtros: todos / Técnico: sempre seus chamados
      url = isAdmin ? "/chamado" : `/chamado/tecnico/${tecnicoId}`;
    } else if (filtrosAtivos === 1) {
      if (statusNum !== null && statusNum !== undefined) {
        url = isAdmin 
          ? `/chamado/status/${statusNum}` 
          : `/chamado/tecnico/${tecnicoId}`;
      }
      if (prioridadeNum !== null && prioridadeNum !== undefined) {
        url = isAdmin 
          ? `/chamado/prioridade/${prioridadeNum}`
          : `/chamado/tecnico/${tecnicoId}`;
      }
      if (tecnicoFiltro) {
        url = `/chamado/tecnico/${encodeURIComponent(tecnicoFiltro)}`;
      }
    } else {
      // Múltiplos filtros
      url = isAdmin ? "/chamado" : `/chamado/tecnico/${tecnicoId}`;
    }
    
    if (callsContainer) {
      callsContainer.innerHTML = "<p>Carregando...</p>";
    }
    
    try {
      console.log("Buscando chamados em:", url);
      const resp = await api.get(url);
      console.log("Resposta chamados:", resp.data);
      const dados = Array.isArray(resp.data) ? resp.data
        : Array.isArray(resp.data?.items) ? resp.data.items
        : Array.isArray(resp.data?.content) ? resp.data.content
        : [];
      console.log("Chamados processados:", dados.length);
      chamadosData = dados;
    } catch (e) {
      console.error("Erro ao buscar chamados:", {
        url,
        status: e?.response?.status,
        data: e?.response?.data,
        msg: e?.message
      });
      chamadosData = [];
      if (callsContainer) callsContainer.innerHTML = "<p>Erro ao carregar chamados.</p>";
    }
  }

  // Aplica filtros locais (busca + combinação quando necessário)
  function aplicarFiltrosLocais() {
    const buscaTxt         = norm(searchInput?.value);
    const statusTexto      = norm(statusSelect?.value);
    const prioridadeTexto  = norm(prioridadeSelect?.value);
    const responsavelId    = responsavelSelect?.value?.trim() || "";

    const statusNum = statusTexto ? statusMap[statusTexto] : null;
    const prioridadeNum = prioridadeTexto ? prioridadeMap[prioridadeTexto] : null;

    filteredData = chamadosData.filter(c => {
      const titulo = norm(c.titulo);
      const protocolo = String(c.protocolo || c.idChamado || "").toLowerCase();
      const statusCard = c.status;
      const prioridadeCard = c.prioridade;
      const tecnicoIdCard = String(c.tecnico?.id || c.idTecnico || c.tecnicoId || "");
      const tecnicoNome = norm(c.tecnico?.nome || c.responsavel || c.nomeTecnico || "");

      // Técnico comum: sempre filtra por seu próprio ID
      if (!isAdmin && tecnicoIdCard !== tecnicoId) return false;

      if (statusNum !== null && statusCard !== statusNum) return false;
      if (prioridadeNum !== null && prioridadeCard !== prioridadeNum) return false;
      if (responsavelId && tecnicoIdCard !== responsavelId) return false;

      if (buscaTxt) {
        if (!titulo.includes(buscaTxt) && !protocolo.includes(buscaTxt) && !tecnicoNome.includes(buscaTxt))
          return false;
      }
      return true;
    });
    console.log("Filtrados:", filteredData.length);
  }

  // Renderização de cards + paginação
  function renderChamados() {
    if (!callsContainer) return;
    if (!filteredData.length) {
      callsContainer.innerHTML = "<p>Nenhum chamado encontrado.</p>";
      updateChart();
      renderPagination();
      return;
    }
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredData.slice(start, start + itemsPerPage);

    callsContainer.innerHTML = pageItems.map(c => {
      const prioridadeTexto = prioridadeReverseMap[c.prioridade] || "baixa";
      const statusTexto = statusReverseMap[c.status] || "aberto";

      const prioridadeDisplay = prioridadeTexto.charAt(0).toUpperCase() + prioridadeTexto.slice(1);
      const statusDisplay = statusTexto.charAt(0).toUpperCase() + statusTexto.slice(1);
      const tecnicoRaw = c.tecnico?.nome || c.responsavel || c.nomeTecnico || "Não atribuído";
      const tecnicoFmt = tecnicoRaw.charAt(0).toUpperCase() + tecnicoRaw.slice(1);
      const dataFmt = c.dataAbertura
        ? new Date(c.dataAbertura).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})
        : "Sem data";

      return `
        <div class="call-card" data-id="${c.idChamado || c.id}" data-protocolo="${c.protocolo || c.idChamado || c.id}">
          <p><strong>Cód: #${c.protocolo || c.idChamado || c.id}</strong> - ${c.titulo || "Sem título"}</p>
          <p>${tecnicoFmt} - ${dataFmt}</p>
          <div class="info-line">
            <span class="priority ${prioridadeTexto}">
              <i class="fa-solid fa-chart-simple"></i>${prioridadeDisplay}
            </span>
            <span class="status ${statusTexto}">
              <i class="fa-solid fa-gauge"></i>${statusDisplay}
            </span>
          </div>
        </div>
      `;
    }).join("");

    const callCards = callsContainer.querySelectorAll(".call-card");
    callCards.forEach(card => {
      card.addEventListener("click", () => {
        const codigo = card.dataset.protocolo;
        sessionStorage.setItem("usuarioTipo", "tecnico");
        window.location.href = `chamado.html?codigo=${encodeURIComponent(codigo)}`;
      });
    });

    updateChart();
    renderPagination();
  }

  // Gráfico (status visíveis)
  function updateChart() {
    const baseCodes = [0,1,2,3];
    const countsByCode = {0:0,1:0,2:0,3:0};

    filteredData.forEach(c => {
      const code = typeof c.status === "number" ? c.status : statusMap[String(c.status).toLowerCase()] ?? 0;
      if (countsByCode[code] !== undefined) countsByCode[code] += 1;
    });

    const activeCodes = baseCodes.filter(code => countsByCode[code] > 0);
    const labels = activeCodes.map(code => {
      const txt = statusReverseMap[code];
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    });
    const data = activeCodes.map(code => countsByCode[code]);
    const colors = activeCodes.map(code => statusColorMap[code]);

    const ctx = document.getElementById("statusChart");
    if (!ctx) return;
    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        cutout: "55%"
      }
    });
  }

  // Paginação
  function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const pagEl = document.getElementById("pagination-info");
    if (pagEl) pagEl.textContent = `Página ${currentPage} de ${totalPages}`;
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }
  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderChamados();
    }
  });
  document.getElementById("nextPage")?.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderChamados();
    }
  });

  // Ciclo principal de atualização
  async function atualizarLista() {
    currentPage = 1;
    await carregarChamadosBackend();
    aplicarFiltrosLocais();
    renderChamados();
    calcularTempoMedioPainel(chamadosData);
  }

  // Eventos de filtros
  statusSelect?.addEventListener("change", atualizarLista);
  prioridadeSelect?.addEventListener("change", atualizarLista);
  responsavelSelect?.addEventListener("change", atualizarLista);
  if (searchInput) {
    let debounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        aplicarFiltrosLocais();
        currentPage = 1;
        renderChamados();
      }, 300);
    });
  }

  // Inicialização
  carregarTecnicos();
  atualizarLista();

  // Logout
  const btnSair = 
    document.getElementById("logout") || 
    document.querySelector(".logout");

  if (btnSair) {
    btnSair.addEventListener("click", (e) => {
      e.preventDefault();

      // Limpando sessão
      sessionStorage.clear();
      localStorage.removeItem("tecnicoNome");
      localStorage.removeItem("tecnicoId");

      // Impede o voltar do navegador
      window.location.replace("loginTecnico.html");
    });
  }
  
  // Modal de agenda
  const agendaBtn = document.getElementById("agendaBtn");
  const agendaModal = document.getElementById("agendaModal");
  const closeAgenda = agendaModal.querySelector(".close");
  const salvarEventoBtn = document.getElementById("salvarEvento");
  const listaEventos = document.getElementById("listaEventos");

  // Abrir modal
  agendaBtn.addEventListener("click", () => {
    agendaModal.style.display = "block";
    carregarEventos(); // carrega eventos salvos
  });

  // Fechar modal
  closeAgenda.addEventListener("click", () => {
    agendaModal.style.display = "none";
  });

  // Fechar clicando fora
  window.addEventListener("click", (e) => {
    if (e.target === agendaModal) agendaModal.style.display = "none";
  });

  // Função para carregar eventos do sessionStorage
  function carregarEventos() {
    const eventos = JSON.parse(sessionStorage.getItem("eventosAgenda") || "[]");
    listaEventos.innerHTML = ""; // limpa lista antes de renderizar
    eventos.forEach(ev => {
      const li = document.createElement("li");
      li.textContent = `${ev.data} ${ev.hora} - ${ev.titulo}`;
      listaEventos.appendChild(li);
    });
  }

// Salvar evento
  salvarEventoBtn.addEventListener("click", () => {
    const titulo = document.getElementById("evento").value;
    const data = document.getElementById("dataEvento").value;
    const hora = document.getElementById("horaEvento").value;

    if (!titulo || !data || !hora) {
      alert("Preencha todos os campos!");
      return;
    }

    // Cria objeto do evento
    const novoEvento = { titulo, data, hora };

    // Recupera array atual do sessionStorage e adiciona o novo
    const eventos = JSON.parse(sessionStorage.getItem("eventosAgenda") || "[]");
    eventos.push(novoEvento);
    sessionStorage.setItem("eventosAgenda", JSON.stringify(eventos));

    carregarEventos(); // atualiza lista

    // Limpa campos
    document.getElementById("evento").value = "";
    document.getElementById("dataEvento").value = "";
    document.getElementById("horaEvento").value = "";
  });

  // Abrir modal de admin
  const adminBtn = document.getElementById("adminBtn");
  const adminModal = document.getElementById("adminModal");
  const closeAdmin = adminModal?.querySelector(".close");

  if(adminBtn && adminModal){
      adminBtn.addEventListener("click", () => {
          adminModal.style.display = "block";
      });
  }

  if(closeAdmin){
      closeAdmin.addEventListener("click", () => {
          adminModal.style.display = "none";
      });
  }

  // Fechar clicando fora do modal
  window.addEventListener("click", (e) => {
      if(e.target === adminModal){
          adminModal.style.display = "none";
      }
  });

  // Admin (senha) 
  const adminForm = document.getElementById("adminForm");
  const adminMsg  = document.getElementById("adminMsg"); 

  adminForm.onsubmit = async function(e) {
  e.preventDefault();
  const senhaDigitada = document.getElementById("adminPassword").value;
  const email = localStorage.getItem("tecnicoEmail");
  
  try {
    const resp = await api.post("/tecnico/login", {
          email: email,
          senha: senhaDigitada
    });

    const data = resp.data;

    if (data.administrador) {
      adminMsg.textContent = "Acesso liberado! Redirecionando...";
      adminMsg.className = "msg sucesso";
      adminMsg.style.display = "block";
      setTimeout(() => window.location.href = "relatorioAdmin.html", 1500);
    } else {
      adminMsg.textContent = "Sem permissão!";
      adminMsg.className = "msg erro";
      adminMsg.style.display = "block";
    }
  } catch (err) {
    adminMsg.textContent = "Senha incorreta!";
    adminMsg.className = "msg erro";
    adminMsg.style.display = "block";
    console.error(err);
  }
  };

  function calcularTempoMedioPainel(chamados) {
    const fechadosMesLista = chamados.filter(c => c.status === 2);

    const tempos = fechadosMesLista
      .filter(c => c.dataConclusao && c.dataAbertura)
      .map(c =>
        (new Date(c.dataConclusao) - new Date(c.dataAbertura)) / 3600000
      );

    const tempoMedio = tempos.length
      ? `${(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1)}h`
      : "0h";

    // Preenche o painel
    const tempoEl = document.getElementById("tempoMedioPainel");
    if (tempoEl) tempoEl.textContent = tempoMedio;
  }

});