import api from "./api.js";

document.addEventListener("DOMContentLoaded", () => {

// Verifica se está logado
//if (sessionStorage.getItem("logado") !== "true") {
 //window.location.href = "loginTecnico.html";
//}

// Exibir nome do técnico no sidebar
const profileText = document.querySelector(".profile p");
const tecnicoNome = sessionStorage.getItem("tecnicoNome");

if (profileText && tecnicoNome) {
  // Deixa a primeira letra maiúscula
  const nomeFormatado = tecnicoNome.charAt(0).toUpperCase() + tecnicoNome.slice(1);
  profileText.textContent = `Olá, ${nomeFormatado}`;
}

  // Modal / botões
  const agendaBtn = document.getElementById("agendaBtn");
  const agendaModal = document.getElementById("agendaModal");
  const adminBtn = document.getElementById("adminBtn");
  const adminModal = document.getElementById("adminModal");

  document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => btn.parentElement.parentElement.style.display = "none";
  });

  if (agendaBtn && agendaModal) agendaBtn.onclick = () => agendaModal.style.display = "block";
  if (adminBtn && adminModal) adminBtn.onclick = () => adminModal.style.display = "block";

  // Fecha modal clicando fora
  window.onclick = (e) => {
    if (e.target.classList && e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  };

  // Admin (senha)
  const adminForm = document.getElementById("adminForm");
  const adminMsg = document.getElementById("adminMsg");
  if (adminForm) {
  adminForm.onsubmit = async function(e) {
    e.preventDefault();

    const senha = document.getElementById("adminPassword").value;
    adminMsg.textContent = "Verificando...";
    adminMsg.className = "msg neutro";
    adminMsg.style.display = "block";

    try {
      //Envia senha para o backend
      const response = await api.post("/admin/validar", { senha });

      if (response.data && response.data.isAdmin === true) {
        sessionStorage.setItem("isAdmin", "true");
        sessionStorage.setItem("adminLogado", "true");

        adminMsg.textContent = "✅ Acesso liberado! Redirecionando...";
        adminMsg.className = "msg sucesso";

        setTimeout(() => window.location.href = "relatorioAdmin.html", 1500);
      } else {
        adminMsg.textContent = "❌ Acesso negado. Senha inválida.";
        adminMsg.className = "msg erro";
      }
    } catch (error) {
      console.error("Erro ao validar administrador:", error);
      adminMsg.textContent = "⚠️ Erro na comunicação com o servidor.";
      adminMsg.className = "msg erro";
    }
  };
}

 // Logout
 const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("logado"); // limpa a sessão
      window.location.href = "loginTecnico.html"; // redireciona
    };
  }

  // Seletores (pesquisa + filtros + cards)
  const searchInput = document.querySelector(".topbar input");
  const statusSelect = document.getElementById("status");
  const prioridadeSelect = document.getElementById("prioridade");
  const responsavelSelect = document.getElementById("responsavel");
  const callsContainer = document.querySelector(".calls");

  // Pega os cards dinamicamente
  let callCards = [];
  let statusChart = null;
  let currentPage = 1;
  const itemsPerPage = 5;

  function normalizeText(str) {
    if (!str) return "";
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  
   //Função para carregar chamados do backend
  async function carregarChamados() {
    try {
      const response = await api.get(`/chamado`); // endpoint da API
      renderChamados(response.data);
    } catch (error) {
      console.error("Erro ao carregar chamados:", error);
      callsContainer.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar chamados.</p>`;
    }
  }

  // Renderizar cards dinamicamente 
  function renderChamados(chamados) {
    callsContainer.innerHTML = "";

    chamados.forEach(chamado => {
      const card = document.createElement("div");
      card.classList.add("call-card");
      card.dataset.id = chamado.id;

      card.innerHTML = `
        <p><strong>Cód: #${chamado.id}</strong> - ${chamado.titulo}</p>
        <p>${chamado.responsavel || "IA"} - ${new Date(chamado.dataCriacao).toLocaleString()}</p>
        <div class="info-line">
          <span class="priority ${chamado.prioridade?.toLowerCase() || "baixa"}">
            <i class="fa-solid fa-chart-simple"></i>${chamado.prioridade || "Baixa"}
          </span>
          <span class="status ${chamado.status?.toLowerCase() || "aberto"}">
            <i class="fa-solid fa-gauge"></i>${chamado.status || "Aberto"}
          </span>
        </div>
      `;

      // redireciona ao clicar
      card.addEventListener("click", () => {
        const codigo = chamado.id;
        sessionStorage.setItem("usuarioTipo", "tecnico");
        window.location.href = `chamado.html?codigo=${encodeURIComponent(codigo)}`;
      });

      callsContainer.appendChild(card);
    });

    callCards = document.querySelectorAll(".call-card");
    showPage(); // reinicia a paginação
    updateChart();
  }

  // Função de filtro (aplica pesquisa + selects) ---
  function aplicarFiltros() {
    const searchText = normalizeText(searchInput?.value || "");
    const status = normalizeText(statusSelect?.value || "");
    const prioridade = normalizeText(prioridadeSelect?.value || "");
    const responsavel = normalizeText(responsavelSelect?.value || "");

    callCards.forEach(card => {
      const cardText = normalizeText(card.innerText || "");
      // Preferimos usar a segunda classe do elemento .status (ex: <span class="status andamento">Em andamento</span>)
      const statusEl = card.querySelector(".status");
      const cardStatusClass = statusEl ? normalizeText(statusEl.classList[1] || "") : normalizeText(statusEl?.innerText || "");
      const prioridadeEl = card.querySelector(".priority");
      const cardPrioridadeClass = prioridadeEl ? normalizeText(prioridadeEl.classList[1] || "") : normalizeText(prioridadeEl?.innerText || "");

      let mostrar = true;

      // pesquisa por texto
      if (searchText && !cardText.includes(searchText)) mostrar = false;

      // status (compara classe ex: 'aberto' / 'andamento' / 'fechado')
      if (status && cardStatusClass !== status) mostrar = false;

      // prioridade (compara classe ex: 'baixa' / 'media' / 'alta')
      if (prioridade && cardPrioridadeClass !== prioridade) mostrar = false;

      // responsavel (procura o nome no texto do card)
      if (responsavel && !cardText.includes(responsavel)) mostrar = false;

      card.style.display = mostrar ? "block" : "none";
    });

    // após filtrar, atualiza o gráfico para refletir os cards visíveis
    updateChart();
  }

  // Eventos
  if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
  if (statusSelect) statusSelect.addEventListener("change", aplicarFiltros);
  if (prioridadeSelect) prioridadeSelect.addEventListener("change", aplicarFiltros);
  if (responsavelSelect) responsavelSelect.addEventListener("change", aplicarFiltros);

  // Função que conta status dos cards (somente os visíveis)
  function countStatusesFromCards() {
    const counts = { aberto: 0, andamento: 0, fechado: 0, atrasado: 0 };
    callCards.forEach(card => {
      if (getComputedStyle(card).display === "none") return;
      const statusEl = card.querySelector(".status");
      const key = normalizeText(statusEl?.classList[1] || statusEl?.innerText || "");
      if (key in counts) counts[key]++;
    });
    return counts;
  }

  // Torna os cards clicáveis e envia o técnico para a página de acompanhamento
document.querySelectorAll(".call-card").forEach(card => {
  card.addEventListener("click", () => {
    const codigo = card.dataset.id;
     if (codigo) {
      // Salva sessão como técnico logado
      sessionStorage.setItem("usuarioTipo", "tecnico");
      // Redireciona para acompanhamento com código
      window.location.href = `chamado.html?codigo=${encodeURIComponent(codigo)}`;
    }
  });
});

  // Cria o gráfico (se Chart estiver carregado e canvas existir)
  function createChart() {
    const canvas = document.getElementById("statusChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const initial = countStatusesFromCards();

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Aberto", "Em andamento", "Fechado", "Atrasado"],
        datasets: [{
          label: "Chamados",
          data: [initial.aberto, initial.andamento, initial.fechado, initial.atrasado],
          backgroundColor: ["#007bff", "#ffc107", "#28a745", "#dc3545"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // Atualiza dados do gráfico
  function updateChart() {
    if (!statusChart) return;
    const counts = countStatusesFromCards();
    statusChart.data.datasets[0].data = [counts.aberto, counts.andamento, counts.fechado, counts.atrasado];
    statusChart.update();
  }

  // inicializa o gráfico
  createChart();

  // PAGINAÇÃO 
 function renderPagination() {
    const totalPages = Math.ceil(callCards.length / itemsPerPage);
    const pageNumbers = document.getElementById("pageNumbers");
    if (!pageNumbers) return;
    pageNumbers.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        showPage();
      });
      pageNumbers.appendChild(btn);
    }
  }

  function showPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    callCards.forEach((card, index) => {
      card.style.display = (index >= start && index < end) ? "block" : "none";
    });

    renderPagination();
  }

  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      showPage();
    }
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    const totalPages = Math.ceil(callCards.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      showPage();
    }
  });

  //  Inicialização 
  carregarChamados(); //Chama o backend e carrega os chamados
});
