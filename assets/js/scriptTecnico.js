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
