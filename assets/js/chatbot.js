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
      const response = await api.post("/chamado", { message: problema });
      return response.data;
    } catch (error) {
      console.error("Erro ao enviar para o backend:", error);
      return { resposta: "Desculpe, houve um erro ao processar sua solicitação." };
    }
  }

  // 1. Busca ou cria usuário
  async function obterOuCriarUsuario() {
    try {
      // Tenta buscar por email primeiro
      const buscaResp = await api.get(`/usuario/email/${encodeURIComponent(userData.email)}`);
      
      if (buscaResp.data && buscaResp.data.id) {
        console.log("Usuário encontrado:", buscaResp.data);
        return buscaResp.data.id;
      }
    } catch (error) {
      // Se não encontrou (404), cria novo
      if (error?.response?.status === 404) {
        console.log("Usuário não encontrado, criando novo...");
        try {
          const criarResp = await api.post("/usuario", {
            nome: userData.nome,
            email: userData.email,
            telefone: userData.telefone
          });
          console.log("Usuário criado:", criarResp.data);
          return criarResp.data.id || criarResp.data.idUsuario;
        } catch (createError) {
          console.error("Erro ao criar usuário:", createError);
          throw createError;
        }
      }
      console.error("Erro ao buscar usuário:", error);
      throw error;
    }
  }

  // 2. Cria chamado com idUsuario e descricao
  async function criarChamadoBackend(idUsuario) {
    try {
      const response = await api.post("/chamado", {
        idUsuario: idUsuario,
        descricao: userData.problema,
      });
      console.log("Chamado criado:", response.data);
      return response.data; // { idChamado, protocolo, ... }
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      throw error;
    }
  }

  // -- Fluxo da conversa --
  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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
        userData.problema = userMsg;

        botSay("Estou analisando seu problema, só um momento... 🤔", false);

        enviarParaBackend(userData.problema).then((res) => {
          const respostaIA = res.reply || "Não consegui encontrar uma solução imediata.";
          botSay(respostaIA, false);

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

          userInput.disabled = true;
          sendBtn.disabled = true;

          document.getElementById("abrir-termos").addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("lgpd-modal").style.display = "block";
          });

          document.getElementById("close-modal").addEventListener("click", () => {
            document.getElementById("lgpd-modal").style.display = "none";
          });

          window.addEventListener("click", (e) => {
            if (e.target === document.getElementById("lgpd-modal")) {
              document.getElementById("lgpd-modal").style.display = "none";
            }
          });

          document.getElementById("confirmar-consentimento").addEventListener("click", async () => {
            const check = document.getElementById("consentimentoLGPD");
            if (!check.checked) {
              botSay("Você precisa aceitar os termos para abrir o chamado. ⚠️");
              return;
            }

            try {
              botSay("Criando seu chamado... ⏳", false);
              
              // 1. Busca ou cria usuário
              const idUsuario = await obterOuCriarUsuario();
              console.log("ID do usuário:", idUsuario);
              
              // 2. Cria chamado com idUsuario
              const resultado = await criarChamadoBackend(idUsuario);
              
              consentDiv.remove();

              const protocolo = resultado.protocolo || resultado.idChamado || "N/A";
              botSay(`Perfeito! Seu chamado foi registrado com o protocolo #${protocolo}. ✅`, false);
              
              setTimeout(() => {
                botSay("Nossa equipe entrará em contato através do e-mail ou telefone informados.", false);
                setTimeout(() => {
                  botSay("Se precisar de mais alguma coisa, digite 'reiniciar' para começar novamente. 🙂", true, "Digite: reiniciar");
                  step = 100;
                }, 800);
              }, 800);

            } catch (error) {
              console.error("Erro ao registrar o chamado:", error);
              consentDiv.remove();
              botSay("Desculpe, houve um erro ao registrar o chamado. Tente novamente mais tarde. 😔", false);
              setTimeout(() => {
                botSay("Digite 'reiniciar' para começar novamente. 🙂", true, "Digite: reiniciar");
                step = 100;
              }, 800);
            }
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
      e.preventDefault();
      chatContainer.classList.add("active");
      if (step === 0 || step === 99) {
        step = 0;
        setTimeout(() => startConversation(), 400);
      }
    });
  }

  const logo = document.querySelector('.logo, #logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      const to4Devs = location.pathname.includes('/pages/') ? '../4devs.html' : './4devs.html';
      window.location.href = to4Devs;
    });
  }
});
