//Página Área de login técnico
    const formLogin = document.getElementById('form-login');
    const erro = document.getElementById('erro-login');
    const sucesso = document.getElementById('sucesso-login');
    
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      
      if(usuario === 'tecnico' && senha === '123456') {
        erro.style.display = 'none';
        sucesso.style.display = 'block';
        sucesso.textContent = '✅ Login realizado com sucesso! Redirecionando...';

        // Salva sessão (simples, só pro frontend)
        sessionStorage.setItem("logado", "true");

        // Redireciona após 2 segundos
        setTimeout(() => {
          window.location.href = "painelTecnico.html";
        }, 2000);

      } else {
        sucesso.style.display = 'none';
        erro.style.display = 'block';
        erro.textContent = '❌ Usuário ou senha incorretos!';
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

