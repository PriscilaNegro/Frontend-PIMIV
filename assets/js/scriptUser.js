import api from "./api.js";

// Detecta qual página está aberta pelo nome do arquivo
const pagina = window.location.pathname.split("/").pop();

// Página inicial (index.html)
if (pagina === "index.html") {
  const form = document.getElementById("form-chamado");
  const input = document.getElementById("chamado");
  const erro = document.getElementById("erro");

  if (form) {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      const codigo = input.value.trim();

      // Regex para validar: somente números, 4 a 6 dígitos
      const regex = /^\d{4,6}$/;

      if (!regex.test(codigo)) {
        erro.textContent = "Digite um código válido (somente números, entre 4 e 6 dígitos).";
        erro.style.display = "block";
        return;
      }

      erro.style.display = "none"; // limpa mensagem
      
      // Marca que o chamado está ativo
      sessionStorage.setItem("chamadoAtivo", codigo);

      sessionStorage.setItem("usuarioTipo", "cliente");
      window.location.href = `chamado.html?codigo=${encodeURIComponent(codigo)}`;
    });

    input.addEventListener("input", function () {
      const regex = /^\d{4,6}$/;
      if (!regex.test(input.value) && input.value !== "") {
        input.setCustomValidity("Formato inválido. Digite apenas números, entre 4 e 6 dígitos.");
      } else {
        input.setCustomValidity("");
      }
    });
  }
}

// Página de acompanhamento (chamado.html)
if (pagina === "chamado.html") {
  const usuarioTipo = sessionStorage.getItem("usuarioTipo"); // técnico ou cliente
  const codigoAtivo = sessionStorage.getItem("chamadoAtivo");
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  // Se for cliente e não tiver chamado ativo (redireciona)
  if (usuarioTipo !== "tecnico" && !codigoAtivo) {
    window.location.href = "index.html";
  }

  // Exibe o código do chamado na tela
  if (codigo) {
    const display = document.getElementById("codigo");
    if (display) display.textContent = `#${codigo}`;
  }

  //Busca os dados do chamado no backend e exibe nos elementos HTML existentes
  async function carregarChamado() {
    try {
      const codigoChamado = codigo || codigoAtivo;
      const response = await api.get(`/chamado/protocolo/${codigoChamado}`);
      const chamado = response.data;

      const prioridades = {
        0: "Baixa",
        1: "Média",
        2: "Alta"
      };

      const status = {
        0: "Aberto",
        1: "Em Andamento",
        2: "Fechado"
      };

      const dataAbertura = chamado.dataAbertura
      ? new Date(chamado.dataAbertura)
      : null;

      // Atualiza os elementos da tela com as informações do chamado
      document.getElementById("status").textContent =
        status[chamado.status] || "Desconhecido";
      document.getElementById("descricao").textContent =
        chamado.descricao;
      document.getElementById("data-abertura").textContent = 
        chamado.dataAbertura? dataAbertura.toLocaleDateString("pt-BR") : "Não informada";
      document.getElementById("assunto").textContent =
        chamado.titulo;
      document.getElementById("prioridade").textContent =
        prioridades[chamado.prioridade] || "Não informada";
      document.getElementById("solicitante").textContent =
        chamado.usuario.nome;
      document.getElementById("telefone").textContent =
        chamado.usuario.telefone;
      document.getElementById("email").textContent =
        chamado.usuario.email;
      document.getElementById("tecnico").textContent =
        chamado.tecnico.nome;
      
      if (chamado.solucao == null ){
        document.getElementById("solucao-texto").textContent =
          "Solução ainda não registrada.";
      } else {
        document.getElementById("solucao-texto").textContent =
          chamado.solucao.descricao
      }
    } catch (error) {
      console.error("Erro ao buscar chamado:", error);
      alert("Erro ao carregar os dados do chamado. Tente novamente mais tarde.");
    }
  }

  // Carrega as informações assim que a página abrir
  carregarChamado();

  // Exibe botões Editar/Salvar apenas para o técnico 
  const solucaoCampo = document.getElementById("solucao-texto");
  const btnEditar = document.getElementById("btnEditar");
  const btnSalvar = document.getElementById("btnSalvar");
  const botoesTecnico = document.getElementById("botoes-tecnico");

  if (usuarioTipo === "tecnico" && botoesTecnico) {
    botoesTecnico.style.display = "flex"; // mostra os botões
  }

   // Exibe a solução salva (caso exista) 
  if (solucaoCampo) {
    const codigoChamado = codigo || codigoAtivo;
    const solucaoSalva = sessionStorage.getItem(`solucao_${codigoChamado}`);
    if (solucaoSalva) {
      solucaoCampo.value = solucaoSalva;
    }
  }

  if (btnEditar && btnSalvar && solucaoCampo) {
    btnEditar.addEventListener("click", () => {
      solucaoCampo.removeAttribute("readonly");
      solucaoCampo.focus();
      btnEditar.style.display = "none";
      btnSalvar.style.display = "inline-block";
    });

    btnSalvar.addEventListener("click", async () => {
      const texto = solucaoCampo.value.trim();
      if (texto === "") {
        alert("Digite uma solução antes de salvar.");
        return;
      }

     // Salva localmente no sessionStorage 
      const codigoChamado = codigo || codigoAtivo; 
      
     // Chamada para o Backend
      try {
        const response = await api.get(`${baseUrl}/api/solucao`);

        console.log("Resposta do servidor:", response.data);

        // Se der tudo certo no backend, também salva localmente
        sessionStorage.setItem(`solucao_${codigoChamado}`, texto);

        alert("Solução salva com sucesso!");}
        catch (error){
          console.error("Erro ao salvar solução:", error);
          alert("Ocorreu um erro ao salvar a sulução")
        }
     
      solucaoCampo.setAttribute("readonly", true);
      btnSalvar.style.display = "none";
      btnEditar.style.display = "inline-block";
    });
  }

  // Botão sair (comportamento muda conforme tipo de usuário)
  const btnSair = document.querySelector(".btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      if (usuarioTipo === "tecnico") {
        sessionStorage.removeItem("usuarioTipo");
        window.location.href = "painelTecnico.html";
      } else {
        sessionStorage.removeItem("chamadoAtivo");
        window.location.href = "index.html";
      }
    });
  }
}



