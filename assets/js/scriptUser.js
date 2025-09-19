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
  // Verifica se o usuário tem um chamado ativo
  const codigoAtivo = sessionStorage.getItem("chamadoAtivo");
  if (!codigoAtivo) {
    // Redireciona se não houver chamado ativo
    window.location.href = "index.html";
  }

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (codigo) {
    const display = document.getElementById("codigo");
    if (display) display.textContent = `#${codigo}`;
  }

  // Botão de sair
  const btnSair = document.querySelector(".btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      sessionStorage.removeItem("chamadoAtivo"); // limpa sessão
      window.location.href = "index.html"; // redireciona
    });
  }
}


