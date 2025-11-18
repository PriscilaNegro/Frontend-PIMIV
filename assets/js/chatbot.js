import {api} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const chatCharacter = document.getElementById("chat-character");
  const chatContainer = document.getElementById("chat-container");
  const chatClose = document.getElementById("chat-close");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  let step = 0;
  const userData = {};

  // -- Funções de utilidade --
  function addMessage(text, sender) {
    const el = document.createElement("div");
    el.className = `message ${sender}`;
    el.innerText = text;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

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

  function startConversation() {
    step = 1;
    botSay("Olá! Sou a Steph, sua assistente virtual. 🤖");
    setTimeout(() => {
      botSay("Qual é o seu nome?", true, "Digite seu nome...");
    }, 800);
  }

  // -- Funções de validação --
  function validarNome(nome) {
    const clean = nome.trim();
    return (
      /^[A-Za-zÀ-ÿ\s]{3,}$/.test(clean) &&
      /[aeiouáéíóúàèìòùãõâêîôû]/i.test(clean)
    );
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function validarTelefone(telefone) {
    return /^\d{8,}$/.test(telefone.replace(/\D/g, ""));
  }

  function validarTexto(texto) {
    const clean = texto.trim();
    return (
      clean.length > 2 &&
      /[A-Za-zÀ-ÿ]/.test(clean) &&
      /[aeiouáéíóúàèìòùãõâêîôû]/i.test(clean)
    );
  }

  async function enviarParaBackend(problema) {
  try {
    const response = await api.post("/chat", { message: userData.problema });
    return response.data; // o backend deve retornar resposta: "texto da IA" 
  } catch (error) {
    console.error("Erro ao enviar para o backend:", error);
    return { resposta: "Desculpe, houve um erro ao processar sua solicitação." };
  }
}

  // -- Fluxo da conversa --
  // Normaliza o texto removendo acentos e colocando tudo em minúsculas
  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD") // separa acentos das letras
      .replace(/[\u0300-\u036f]/g, ""); // remove os acentos
  }

  function botFlow(userMsg) {
    const msg = normalizarTexto(userMsg.trim());

    if (msg === "reiniciar") {
      userInput.value = "";
      for (let key in userData) userData[key] = "";
      step = 0;
      chatBox.innerHTML = "";
      startConversation();
      return;
    }

    switch (step) {
      case 1: // Nome
        if (!validarNome(userMsg)) {
          botSay("Ops! Poderia digitar um nome válido, por favor?");
          setTimeout(() => {
            botSay("Qual é o seu nome?", true, "Digite seu nome...");
          }, 600);
          return;
        }
        userData.nome = userMsg;
        botSay(`Prazer, ${userData.nome}! Agora, poderia me informar seu e-mail?`, true, "Digite seu e-mail...");
        step = 2;
        break;

      case 2: // Email
        if (!validarEmail(userMsg)) {
        botSay("Hmmm... esse e-mail parece inválido. Tente novamente, por favor. 📧", true, "Digite um e-mail válido...");
        return;
      }
      userData.email = userMsg;
     botSay("Perfeito! Qual o seu telefone para contato?", true, "Ex: 11987654321");
      step = 3;
     break;

      case 3: // Telefone
       if (!validarTelefone(userMsg)) {
        botSay("O número de telefone deve conter apenas dígitos e ter pelo menos 8 números. 📱", true, "Digite apenas números...");
        return;
      }
      userData.telefone = userMsg;
      botSay("Agora, descreva o problema que você está enfrentando.", true, "Descreva o problema...");
      step = 4;
      break;
      
      case 4: // Descrição do problema
        if (!validarTexto(userMsg)) {
          botSay("Não consegui entender o problema. Pode descrever de forma mais detalhada, por favor?", true, "Descreva melhor o problema...");
          return;
        }
        userData.problema = msg;

        // Envia para o backend para tentar solução automática via IA
        botSay("Estou analisando seu problema, só um momento... 🤔", false);

        enviarParaBackend(userData.problema).then((res) => {
          const respostaIA = res.reply || "Não consegui encontrar uma solução imediata.";

          botSay(respostaIA, false);

          // Dependendo da resposta, pode continuar o fluxo normal
          setTimeout(() => {
            botSay("Deseja abrir um chamado com nossa equipe? (sim / não)", true, "Digite: sim ou não");
            step = 6;
          }, 1000);
        });
      break;

      case 5: // Resposta ao problema de internet
        if (msg === "sim") {
          botSay("Que ótimo! Fico feliz em ajudar 😊", false);
          setTimeout(() => {
            botSay("Se precisar de mais alguma coisa, digite 'reiniciar' para começar novamente. 🙂", true, "Digite: reiniciar");
            step = 100;
          }, 800);
        } else if (msg === "nao") {
          botSay("Entendi. Deseja abrir um chamado com nossa equipe? (sim / não)", true, "Digite: sim ou não");
          step = 6;
        } else {
          botSay("Desculpe, não entendi. Responda apenas com 'sim' ou 'não'.", true, "Digite: sim ou não");
        }
        break;

      case 6: // Abrir chamado
       if (msg === "sim") {
        // Exibe o checkbox de consentimento antes de continuar
       const consentDiv = document.createElement("div");
        consentDiv.className = "consentimento-container";
        consentDiv.innerHTML = `
          <label>
            <input type="checkbox" id="consentimentoLGPD">
            Aceito os <a href="#" id="abrir-termos">termos de consentimento</a>
          </label>
          <button id="confirmar-consentimento" class="btn-consentir">Confirmar</button>
        `;
        chatBox.appendChild(consentDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Bloqueia a digitação até o cliente aceitar
        userInput.disabled = true;
        sendBtn.disabled = true;

        // Abre o modal ao clicar em "termos"
        document.getElementById("abrir-termos").addEventListener("click", (e) => {
          e.preventDefault();
          document.getElementById("lgpd-modal").style.display = "block";
        });

        // Fecha o modal
        document.getElementById("close-modal").addEventListener("click", () => {
        document.getElementById("lgpd-modal").style.display = "none";
      });

      // Fecha o modal ao clicar fora
       window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("lgpd-modal")) {
          document.getElementById("lgpd-modal").style.display = "none";
        }
        });

      // Clique em "Confirmar"
       document.getElementById("confirmar-consentimento").addEventListener("click", async () => {
        const check = document.getElementById("consentimentoLGPD");
        if (!check.checked) {
          botSay("Você precisa aceitar os termos para abrir o chamado. ⚠️");
          return;
        }

      // Se aceitou, prossegue com o fluxo normal
      const protocolo = gerarProtocolo();
       
      // Monta os dados do chamado
      const chamado = {
        codigo: protocolo,
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone,
        problema: userData.problema,
        status: "Aberto",
        prioridade: "Média",
        tecnico: "A definir",
        dataAbertura: new Date().toISOString()
      };

       // Envia para o backend
      try {
        await api.post("/chamados", chamado);
        consentDiv.remove();

        botSay(`Perfeito, registrei seu chamado com o protocolo #${protocolo}. ✅`, false);
      } catch (error) {
        console.error("Erro ao registrar o chamado:", error);
        botSay("Desculpe, houve um erro ao registrar o chamado. 😔", false);
        return;
      }

      // Mensagens finais
      setTimeout(() => {
        botSay("Nossa equipe entrará em contato através do e-mail ou telefone informados.", false);
        setTimeout(() => {
          botSay("Se precisar de mais alguma coisa, digite 'reiniciar' para começar novamente. 🙂", true, "Digite: reiniciar");
          step = 100;
        }, 800);
      }, 800);
    });

    } else if (msg === "nao") {
      botSay("Certo, não abriremos um chamado agora.", false);
      setTimeout(() => {
        botSay("Se mudar de ideia, digite 'reiniciar' para começar novamente. 🙂", true, "Digite: reiniciar");
        step = 100;
      }, 800);
    } else {
      botSay("Desculpe, não entendi. Responda apenas com 'sim' ou 'não'.", true, "Digite: sim ou não");
    }
    break;

      case 99:
      case 100:
        if (msg === "reiniciar") {
          userInput.value = "";
          for (let key in userData) userData[key] = "";
          step = 0;
          chatBox.innerHTML = "";
          startConversation();
        } else {
          botSay("Se quiser iniciar uma nova conversa, digite 'reiniciar' 🙂", true, "Digite: reiniciar");
        }
        break;
    }
  }

  // -- Envio de mensagens --

  function sendUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;

    setTimeout(() => botFlow(text), 200);
  }

  sendBtn.addEventListener("click", sendUserMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendUserMessage();
  });

  // -- Abertura e fechamento do chat --

  chatCharacter.addEventListener("click", () => {
    chatContainer.classList.toggle("active");
    if (step === 0 || step === 99) {
      step = 0;
      setTimeout(() => startConversation(), 400);
    }
  });

  chatClose.addEventListener("click", () => {
    chatContainer.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") chatContainer.classList.remove("active");
  });

  const abrirChatLink = document.getElementById("abrir-chat");
  if (abrirChatLink) {
    abrirChatLink.addEventListener("click", (e) => {
      e.preventDefault(); // evita o comportamento padrão do link
      chatContainer.classList.add("active");
      if (step === 0 || step === 99) {
        step = 0;
        setTimeout(() => startConversation(), 400);
      }
    });
  }

  // Clique no logo -> 4Devs
  const logo = document.querySelector('.logo, #logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      const to4Devs = location.pathname.includes('/pages/') ? '../4devs.html' : './4devs.html';
      window.location.href = to4Devs;
    });
  }
});
