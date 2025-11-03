//Página Área de login técnico
    const formLogin = document.getElementById('form-login');
    const erro = document.getElementById('erro-login');
    const sucesso = document.getElementById('sucesso-login');
    
    formLogin.addEventListener('submit', async function(e) {
      e.preventDefault();

      const usuario = document.getElementById('usuario').value;
      const senha = document.getElementById('senha').value;
      const dominioValido = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      // Oculta mensagens antigas
      erro.style.display = 'none';
      sucesso.style.display = 'none';

      // Validação básica
      if (!usuario || !senha) {
        erro.textContent = '❌ Preencha todos os campos!';
        erro.style.display = 'block';
        return;
      }

      if (!dominioValido.test(usuario)) {
        erro.style.display = 'block';
        erro.textContent = '❌ E-mail inválido!';
        sucesso.style.display = 'none';
        return;
      }

      try {
        // Envia a requisição ao backend
        const response = await fetch('http://localhost:3000/api/login-tecnico', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: usuario,
            senha: senha,
          }),
        });

        // Se o login falhar, exibe erro
        if (!response.ok) {
         throw new Error('Usuário ou senha incorretos!');
        }

        // Converte a resposta JSON
        const data = await response.json();

        // Espera-se que o backend retorne algo assim:
        // {
        //   token: "jwt_aqui",
        //   nome: "Priscila",
        //   email: "tecnico@4devs.com"
        // }

        // Salva as informações de sessão
        localStorage.setItem('token', data.token);
        localStorage.setItem('tecnicoNome', data.nome);
        localStorage.setItem('tecnicoEmail', data.email);
        localStorage.setItem('usuarioTipo', 'tecnico');

        sucesso.textContent = '✅ Login realizado com sucesso!';
        sucesso.style.display = 'block';

        // Redireciona após 1 segundo
        setTimeout(() => {
          window.location.href = 'painelTecnico.html';
        }, 1000);

      } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        erro.style.display = 'block';
        sucesso.style.display = 'none';
        erro.textContent = '❌ Erro ao conectar com o servidor!';
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

