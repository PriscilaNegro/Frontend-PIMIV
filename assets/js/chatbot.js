document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");
  const chatClose = document.getElementById("chat-close");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  if (!chatToggle || !chatContainer || !chatBox || !userInput || !sendBtn) {
    console.warn("Chat widget: elementos não encontrados. Verifique IDs no HTML.");
    return;
  }

  let step = 0;
  const userData = {};

  // adicionar mensagem na tela
  function addMessage(text, sender) {
    const el = document.createElement("div");
    el.className = `message ${sender}`;
    el.innerText = text;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // bot fala
  function botSay(text, expectInput = false, placeholder = "Digite aqui...") {
    setTimeout(() => {
      addMessage(text, "bot");
      if (expectInput) {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.placeholder = placeholder;
        userInput.focus();
      }
    }, 400);
  }

  // inicia conversa
  function startConversation() {
    step = 1;
    botSay("Olá! Sou a Steph, sua assistente virtual. 🤖");
    setTimeout(() => {
      botSay("Qual é o seu nome?", true, "Digite seu nome...");
    }, 800);
  }

  function gerarProtocolo() {
    return Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  }

  // fluxo do bot
  function botFlow(userMsg) {
    switch (step) {
      case 1:
        userData.nome = userMsg;
        botSay(`Prazer, ${userData.nome}! Agora, poderia me informar seu e-mail?`, true, "Digite seu e-mail...");
        step = 2;
        break;

      case 2:
        userData.email = userMsg;
        botSay("Perfeito! Qual o nome da sua empresa?", true, "Digite o nome da empresa...");
        step = 3;
        break;

      case 3:
        userData.empresa = userMsg;
        botSay("Ótimo 👍 E qual o seu telefone para contato?", true, "Ex: (11) 9xxxx-xxxx");
        step = 4;
        break;

      case 4:
        userData.telefone = userMsg;
        botSay("Agora, descreva o problema que você está enfrentando.", true, "Descreva o problema...");
        step = 5;
        break;

      case 5:
        userData.problema = userMsg.toLowerCase();

        if (userData.problema.includes("internet")) {
          botSay("Entendi, você está com problema de internet. 📶", false);
          setTimeout(() => {
            botSay("Tente reiniciar o modem ou verificar os cabos de conexão. Isso resolveu? (sim / não)", true, "Digite: sim ou não");
            step = 6;
          }, 800);
        } else {
          botSay("Não consegui identificar uma solução automática. Deseja abrir um chamado com nossa equipe? (sim / não)", true, "Digite: sim ou não");
          step = 7;
        }
        break;

      case 6: // resposta se internet resolveu ou não
        if (userMsg.trim().toLowerCase() === "sim") {
          botSay("Que ótimo! Fico feliz em ajudar 😊 Se precisar de mais alguma coisa, é só me chamar.", false);
          step = 99;
        } else {
          botSay("Entendi. Deseja abrir um chamado com nossa equipe? (sim / não)", true, "Digite: sim ou não");
          step = 7;
        }
        break;

      case 7: // abrir chamado
        if (userMsg.trim().toLowerCase() === "sim") {
          const protocolo = gerarProtocolo();
          botSay(`Perfeito, registrei seu chamado com o protocolo #${protocolo}. ✅`, false);
          botSay("Nossa equipe entrará em contato através do e-mail ou telefone informados.", false);
          step = 99;
        } else {
          botSay("Certo, não abriremos um chamado agora. Se mudar de ideia, é só reabrir o chat. 🙂", false);
          step = 99;
        }
        break;

      default:
        botSay("Se precisar de mais alguma coisa, reabra o chat.", false);
        break;
    }
  }

  // envia mensagem do usuário
  function sendUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;

    setTimeout(() => botFlow(text), 200);
  }

  // eventos
  sendBtn.addEventListener("click", sendUserMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendUserMessage();
  });

  chatToggle.addEventListener("click", () => {
    const isOpen = chatContainer.classList.contains("active");
    if (isOpen) {
      chatContainer.classList.remove("active");
    } else {
      chatContainer.classList.add("active");
      userInput.disabled = true;
      sendBtn.disabled = true;
      if (step === 0 || step === 99) {
        step = 0;
        setTimeout(() => startConversation(), 400);
      }
    }
  });

  chatClose.addEventListener("click", () => {
    chatContainer.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") chatContainer.classList.remove("active");
  });
});
