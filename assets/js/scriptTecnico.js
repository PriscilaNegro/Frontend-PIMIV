// Verifica se está logado
if (sessionStorage.getItem("logado") !== "true") {
  window.location.href = "loginTecnico.html";
}

document.addEventListener("DOMContentLoaded", () => {

// Exibir nome do técnico no sidebar
const profileText = document.querySelector(".profile p");
const tecnicoNome = sessionStorage.getItem("tecnicoNome");

if (profileText && tecnicoNome) {
  // Deixa a primeira letra maiúscula
  const nomeFormatado = tecnicoNome.charAt(0).toUpperCase() + tecnicoNome.slice(1);
  profileText.textContent = `Olá, ${tecnicoNome}`;
}

  // --- Modal / botões ---
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
    adminForm.onsubmit = function(e) {
      e.preventDefault();
      const senha = document.getElementById("adminPassword").value;
      if (senha === "admin123") {
        // seta a flag antes do redirect
        sessionStorage.setItem("isAdmin", "true");
       
        adminMsg.textContent = "✅ Acesso liberado! Redirecionando...";
        adminMsg.className = "msg sucesso";
        adminMsg.style.display = "block";
        
      // 🔑 Marca sessão de admin
      sessionStorage.setItem("adminLogado", "true");

        setTimeout(() => window.location.href = "relatorioAdmin.html", 1500);
      } else {
        adminMsg.textContent = "❌ Senha incorreta!";
        adminMsg.className = "msg erro";
        adminMsg.style.display = "block";
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

  // Pega os cards dinamicamente (NodeList estática aqui — se for adicionar/remover cards dinamicamente, re-obter)
  const callCards = document.querySelectorAll(".call-card");

  function normalizeText(str) {
    if (!str) return "";
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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

  // Chart.js: contadores a partir dos cards visíveis
  let statusChart = null;

  // Função que conta status dos cards (somente os visíveis)
  function countStatusesFromCards() {
    const counts = { aberto: 0, andamento: 0, fechado: 0, atrasado: 0 };

    callCards.forEach(card => {
      // ignora cards escondidos
      if (getComputedStyle(card).display === "none") return;

      const statusEl = card.querySelector(".status");
      let key = "";
      if (statusEl) {
        // tenta usar a classe (ex: 'andamento'), se não existir usa o texto
        key = normalizeText(statusEl.classList[1] || statusEl.innerText || "");
      } else {
        key = "";
      }

      if (key in counts) {
        counts[key]++;
      }
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
    const canvas = document.getElementById('statusChart');
    if (!canvas) {
      console.warn("Canvas '#statusChart' não encontrado.");
      return;
    }
    if (typeof Chart === 'undefined') {
      console.error("Chart.js não encontrado. Verifique se o script do Chart.js está sendo carregado antes deste arquivo.");
      return;
    }

    const ctx = canvas.getContext('2d');
    const initial = countStatusesFromCards();

    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em andamento', 'Fechado', 'Atrasado'],
        datasets: [{
          label: 'Chamados',
          data: [initial.aberto, initial.andamento, initial.fechado, initial.atrasado],
          backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
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

  // === PAGINAÇÃO ===
const callsContainer = document.querySelector(".calls");
const cards = Array.from(document.querySelectorAll(".call-card"));
const itemsPerPage = 5;
let currentPage = 1;

function renderPagination() {
  const totalPages = Math.ceil(cards.length / itemsPerPage);
  const pageNumbers = document.getElementById("pageNumbers");
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

  cards.forEach((card, index) => {
    card.style.display = (index >= start && index < end) ? "block" : "none";
  });

  renderPagination();
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    showPage();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(cards.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    showPage();
  }
});

// Inicializa
showPage();

});
