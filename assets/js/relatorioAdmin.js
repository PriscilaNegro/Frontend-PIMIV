import api from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (sessionStorage.getItem("isAdmin") !== "true") {
    window.location.href = "painelTecnico.html";
    return 
  }

  // Bloqueia voltar no navegador (remove cache da página)
  window.history.pushState(null, "", window.location.href);
  window.onpopstate = function () {
    sessionStorage.removeItem("isAdmin"); // garante que ao voltar, apaga a sessão
    window.location.href = "painelTecnico.html";
  };

try {
    // Faz requisição ao backend (ajuste o endpoint conforme sua API)
    const response = await api.get("/relatorios/admin");
    const dadosAdmin = response.data;

    preencherRelatorio(dadosAdmin);
  } 
  catch (error) {
  console.error("Erro ao carregar relatório do administrador:", error);
  const erroMsg = document.getElementById("erroMsg");
  erroMsg.textContent = "⚠️ Não foi possível carregar os dados do relatório. Tente novamente mais tarde.";
  erroMsg.style.display = "block";
}
});

//Função para preencher relatório 
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
    sessionStorage.removeItem("isAdmin"); // apaga permissão admin
    window.location.href = "painelTecnico.html";
}
window.voltarPainel = voltarPainel;