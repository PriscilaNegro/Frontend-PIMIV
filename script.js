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
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (codigo) {
    const display = document.getElementById("codigo");
    if (display) display.textContent = `#${codigo}`;
  }
}

//Pádina Área de login técnico
    const formLogin = document.getElementById('form-login');
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      
      if(usuario === 'tecnico' && senha === '123456') {
        alert('Login realizado com sucesso!');
        // Aqui redirecionar para a área do técnico
        // window.location.href = 'painel-tecnico.html';
      } else {
        const erro = document.getElementById('erro-login');
        erro.style.display = 'block';
        erro.textContent = 'Usuário ou senha incorretos!';
      }
    });

// Modal "Esqueci minha senha"
const modal = document.getElementById("modal-recuperar");
const linkEsqueci = document.getElementById("link-esqueci");
const fechar = document.querySelector(".fechar");

if (linkEsqueci) {
  linkEsqueci.addEventListener("click", function(e) {
    e.preventDefault();
    modal.style.display = "flex";
  });
}

if (fechar) {
  fechar.addEventListener("click", function() {
    modal.style.display = "none";
  });
}

window.addEventListener("click", function(e) {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Simulação de envio
const btnRecuperar = document.getElementById("btn-recuperar");
const msgRecuperar = document.getElementById("msg-recuperar");
const btnOk = document.getElementById("btn-ok");

if (btnRecuperar) {
  btnRecuperar.addEventListener("click", function() {
    const email = document.getElementById("email-recuperar").value.trim();

    if (!email) {
      msgRecuperar.textContent = "Por favor, insira seu e-mail.";
      msgRecuperar.className = "msg-recuperar erro";
      btnOk.style.display = "none";
      return;
    }

    // Mensagem sempre genérica
    msgRecuperar.textContent = "Se este e-mail estiver cadastrado, enviaremos as instruções de redefinição.";
    msgRecuperar.className = "msg-recuperar sucesso";

    // Mostra botão OK
    btnOk.style.display = "block";
  });
}

// Botão OK fecha o modal
if (btnOk) {
  btnOk.addEventListener("click", function() {
    modal.style.display = "none";
    msgRecuperar.style.display = "none";
    btnOk.style.display = "none";
    document.getElementById("email-recuperar").value = "";
  });
}

