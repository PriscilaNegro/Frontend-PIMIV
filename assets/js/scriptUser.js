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

    btnSalvar.addEventListener("click", () => {
      const texto = solucaoCampo.value.trim();
      if (texto === "") {
        alert("Digite uma solução antes de salvar.");
        return;
      }

     // Aqui futuramente você pode enviar para o backend via API
     // console.log("Solução salva:", texto);

     // Salva localmente no sessionStorage 
      const codigoChamado = codigo || codigoAtivo; // pega o código atual
      sessionStorage.setItem(`solucao_${codigoChamado}`, texto);
      
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



