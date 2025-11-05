import api from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {

//Pega o nome do técnico logado 
 const tecnicoNome = sessionStorage.getItem ("tecnicoNome") || "Técnico";
 const tecnicoId = sessionStorage.getItem("tecnicoId");
 document.getElementById("tecnicoNome").textContent = `Relatório de ${tecnicoNome}`;

   try {
    // Faz a requisição para o backend
    const response = await api.get(`/relatorios/tecnico/${tecnicoId}`);
    const dadosChamados = response.data;

    preencherRelatorio(dadosChamados);
  } 
  catch (error) {
    console.error("Erro ao carregar relatório do administrador:", error);
    const erroMsg = document.getElementById("erroMsg");
    erroMsg.textContent = "⚠️ Não foi possível carregar os dados do relatório. Tente novamente mais tarde.";
    erroMsg.style.display = "block";
  }
});

// Preenche valores
function preencherRelatorio(dadosChamados) {
document.getElementById("abertosHoje").textContent = dadosChamados.hoje.abertos;
document.getElementById("andamentoHoje").textContent = dadosChamados.hoje.andamento;
document.getElementById("fechadosHoje").textContent = dadosChamados.hoje.fechados;
document.getElementById("atrasadosHoje").textContent = dadosChamados.hoje.atrasados;
document.getElementById("totalHoje").textContent =
  dadosChamados.hoje.abertos +
  dadosChamados.hoje.andamento +
  dadosChamados.hoje.fechados +
  dadosChamados.hoje.atrasados;

document.getElementById("fechadosMes").textContent = dadosChamados.mes.fechados;
document.getElementById("tempoMedio").textContent = dadosChamados.mes.tempoMedio;

// Gráfico Chart.js
const ctx = document.getElementById("graficoChamados").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: dadosChamados.grafico.datas,
    datasets: [
      {
        label: "Abertos",
        data: dadosChamados.grafico.abertos,
        backgroundColor: "rgba(246, 68, 74, 0.6)"
      },
      {
        label: "Fechados",
        data: dadosChamados.grafico.fechados,
        backgroundColor: "rgba(43, 233, 119, 0.6)"
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: true, //legenda visível
        position: "top"
      },
      title: {
        display: true,
        text: "Quantidade de chamados por data"
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        title: {
          display: true,
          text: "Quantidade de chamados"
        }
       },
       x: {
        title: {
          display: true,
          text: "Datas"
        }
       }
    }
  }
});
}

window.voltarPainel = function() {
  window.location.href = "painelTecnico.html";
}

