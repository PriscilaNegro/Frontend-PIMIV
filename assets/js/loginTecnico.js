//Página Área de login técnico
    const formLogin = document.getElementById('form-login');
    const erro = document.getElementById('erro-login');
    const sucesso = document.getElementById('sucesso-login');
    
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      
      // Regex para validar se o e-mail termina com @4devs.com
      const dominioValido = /^[a-zA-Z0-9._%+-]+@4devs\.com$/;

      if(dominioValido.test(usuario)  && senha === '123456') {
        erro.style.display = 'none';
        sucesso.style.display = 'none';

        // Salva sessão (simples, só pro frontend)
        sessionStorage.setItem("logado", "true");
        sessionStorage.setItem("usuarioTipo", "tecnico");

        // Salva o e-mail do técnico logado
        sessionStorage.setItem("tecnicoEmail", usuario);

        // Ajuste: salva apenas o primeiro nome (antes do ponto e antes do @) ---
        let nomeTecnico = usuario.split("@")[0]; // pega antes do @
        if (nomeTecnico.includes(".") || nomeTecnico.includes("_")) {
          nomeTecnico = nomeTecnico.split(/[._]/)[0]; // pega só antes do primeiro ponto
        }

        // Formata primeira letra maiúscula
        nomeTecnico = nomeTecnico.charAt(0).toUpperCase() + nomeTecnico.slice(1);
        sessionStorage.setItem("tecnicoNome", nomeTecnico);

        window.location.href = "painelTecnico.html";

      } else {
        sucesso.style.display = 'none';
        erro.style.display = 'block';

        if (!dominioValido.test(usuario)) {
        erro.textContent = '❌ E-mail inválido!';
        } 
          else {
           erro.textContent = '❌ Usuário ou senha incorretos!';
           }
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

