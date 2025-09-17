// Abrir/fechar modal Agenda
const agendaBtn = document.getElementById("agendaBtn");
const agendaModal = document.getElementById("agendaModal");
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");

// Botões de fechar (x)
document.querySelectorAll(".close").forEach(btn => {
  btn.onclick = () => {
    btn.parentElement.parentElement.style.display = "none";
  };
});

// Eventos de clique
if (agendaBtn && agendaModal) {
  agendaBtn.onclick = () => agendaModal.style.display = "block";
}
if (adminBtn && adminModal) {
  adminBtn.onclick = () => adminModal.style.display = "block";
}

// Validação do admin com mensagem estilizada
const adminForm = document.getElementById("adminForm");
const adminMsg = document.getElementById("adminMsg");

if (adminForm) {
  adminForm.onsubmit = function(e) {
    e.preventDefault();

    const senha = document.getElementById("adminPassword").value;

    if (senha === "admin123") {
      adminMsg.textContent = "✅ Acesso liberado! Redirecionando...";
      adminMsg.className = "msg sucesso";
      adminMsg.style.display = "block";

      // Redireciona depois de 1.5 segundos
      setTimeout(() => {
        window.location.href = "relatorios-globais.html";
      }, 1500);
    } else {
      adminMsg.textContent = "❌ Senha incorreta!";
      adminMsg.className = "msg erro";
      adminMsg.style.display = "block";
    }
  };
}

// Fechar modal ao clicar fora
window.onclick = (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
};

// Redirecionar ao clicar em "Sair"
const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    window.location.href = "loginTecnico.html"; 
  };
}

// --- Pesquisa + Filtros ---
// Função utilitária para normalizar texto (remove acentos e deixa minúsculo)
function normalizeText(str) {
  if (!str) return "";
  return str
    .normalize('NFD')                    // separa acentos
    .replace(/[\u0300-\u036f]/g, '')     // remove acentos
    .toLowerCase()
    .trim();
}

// Seleciona barra de pesquisa e cards de chamados
const searchInput = document.querySelector(".topbar input");
const callCards = document.querySelectorAll(".call-card");

// Seletores de filtro
const statusSelect = document.getElementById("status");
const prioridadeSelect = document.getElementById("prioridade");
const responsavelSelect = document.getElementById("responsavel");

// Função que aplica pesquisa + filtros
function aplicarFiltros() {
  const searchText = searchInput.value.toLowerCase();
  const status = statusSelect.value;
  const prioridade = prioridadeSelect.value;
  const responsavel = responsavelSelect.value;

  callCards.forEach(card => {
    const cardText = card.innerText.toLowerCase();
    const cardStatus = card.querySelector(".status")?.classList[1]; // aberto / andamento / fechado
    const cardPrioridade = card.querySelector(".priority")?.classList[1]; // baixa / media / alta

    let mostrar = true;

    // Filtro pesquisa
    if (searchText && !cardText.includes(searchText)) {
      mostrar = false;
    }

    // Filtro status
    if (status && cardStatus !== status) {
      mostrar = false;
    }

    // Filtro prioridade
    if (prioridade && cardPrioridade !== prioridade) {
      mostrar = false;
    }

    // Filtro responsável
    if (responsavel && !cardText.includes(responsavel)) {
      mostrar = false;
    }

    card.style.display = mostrar ? "block" : "none";
  });
}

// Eventos de pesquisa e filtros
if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
if (statusSelect) statusSelect.addEventListener("change", aplicarFiltros);
if (prioridadeSelect) prioridadeSelect.addEventListener("change", aplicarFiltros);
if (responsavelSelect) responsavelSelect.addEventListener("change", aplicarFiltros);

