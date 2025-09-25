// Simulação: pega o nome do técnico logado do sessionStorage
const tecnicoNome = sessionStorage.getItem ("tecnicoNome") || "Técnico Exemplo";
document.getElementById("tecnicoNome").textContent = `Relatório de ${tecnicoNome}`;

// Simulação de dados (mock)
const mockData = {
  "Joao": {
    hoje: { abertos: 2, andamento: 1, fechados: 3, atrasados: 0 },
    mes: { fechados: 15, tempoMedio: 180 },
    grafico: {
      datas: ["01/09", "02/09", "03/09"],
      abertos: [1, 0, 1],
      fechados: [0, 1, 2]
    }
  },
  
  "Maria": {
    hoje: { abertos: 1, andamento: 2, fechados: 2, atrasados: 1 },
    mes: { fechados: 10, tempoMedio: 220 },
    grafico: {
      datas: ["01/09", "02/09", "03/09"],
      abertos: [0, 1, 0],
      fechados: [1, 0, 1]
    }
  }
};

// Se não existir o nome, cai em um padrão
const dadosChamados = mockData[tecnicoNome] || {
  hoje: { abertos: 0, andamento: 0, fechados: 0, atrasados: 0 },
  mes: { fechados: 0, tempoMedio: 0 },
  grafico: { datas: [], abertos: [], fechados: [] }
};


// Preenche valores
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
        position: top
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

function voltarPainel() {
  window.location.href = "painelTecnico.html";
}

