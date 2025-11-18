import {api} from "./api.js";

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
      const regex = /^\d{4,6}$/;

      if (!regex.test(codigo)) {
        erro.textContent = "Digite um código válido (somente números, entre 4 e 6 dígitos).";
        erro.style.display = "block";
        return;
      }

      erro.style.display = "none";
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
  const usuarioTipo = sessionStorage.getItem("usuarioTipo");
  const codigoAtivo = sessionStorage.getItem("chamadoAtivo");
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  let chamadoAtual = null; // armazena dados do chamado

  if (usuarioTipo !== "tecnico" && !codigoAtivo) {
    window.location.href = "index.html";
  }

  // Normaliza solução para sempre ter { id, descricao }
  function normalizeSolucao(sol) {
    if (!sol) return null;
    return {
      id: sol.id ?? sol.idSolucao ?? sol.codigo ?? null,
      descricao: sol.descricao ?? sol.texto ?? ""
    };
  }

  function setSolucaoIdOnElement(id) {
    const el = document.getElementById("solucao-texto");
    if (el) {
      if (id) el.dataset.solucaoId = String(id);
      else delete el.dataset.solucaoId;
    }
  }

  async function carregarChamado() {
    try {
      const codigoChamado = codigo || codigoAtivo;
      if (!codigoChamado) {
        alert("Código do chamado não encontrado.");
        window.location.href = usuarioTipo === "tecnico" ? "painelTecnico.html" : "index.html";
        return;
      }

      const response = await api.get(`/chamado/protocolo/${codigoChamado}`);
      chamadoAtual = response.data;

      // Normaliza solução e aplica no DOM
      chamadoAtual.solucao = normalizeSolucao(chamadoAtual.solucao);
      const solucaoTexto = document.getElementById("solucao-texto");
      if (solucaoTexto) {
        solucaoTexto.textContent = chamadoAtual.solucao?.descricao || "Solução ainda não registrada.";
        setSolucaoIdOnElement(chamadoAtual.solucao?.id);
      }

      const prioridades = { 0: "Baixa", 1: "Média", 2: "Alta" };
      const status = { 0: "Aberto", 1: "Em Andamento", 2: "Fechado", 3: "Atrasado" };

      const dataAbertura = chamadoAtual.dataAbertura ? new Date(chamadoAtual.dataAbertura) : null;

      const display = document.getElementById("codigo");
      if (display) display.textContent = `#${chamadoAtual.protocolo || codigoChamado}`;

      document.getElementById("status").textContent = status[chamadoAtual.status] || "Desconhecido";
      document.getElementById("descricao").textContent = chamadoAtual.descricao;
      document.getElementById("data-abertura").textContent = 
        dataAbertura ? dataAbertura.toLocaleDateString("pt-BR") : "Não informada";
      document.getElementById("assunto").textContent = chamadoAtual.titulo;
      document.getElementById("prioridade").textContent = prioridades[chamadoAtual.prioridade] || "Não informada";
      document.getElementById("solicitante").textContent = chamadoAtual.usuario.nome;
      document.getElementById("telefone").textContent = chamadoAtual.usuario.telefone;
      document.getElementById("email").textContent = chamadoAtual.usuario.email;
      document.getElementById("tecnico").textContent = chamadoAtual.tecnico?.nome || "Não atribuído";
      
      if (usuarioTipo === "tecnico") {
        mostrarBotoesEdicao();
      }
    } catch (error) {
      console.error("Erro ao buscar chamado:", error?.response || error);
      showFeedback("Falha ao carregar dados do chamado.", "erro");
    }
  }

  function mostrarBotoesEdicao() {
    const botoesTecnico = document.getElementById("botoes-tecnico");
    if (botoesTecnico) {
      botoesTecnico.style.display = "flex";
    }
  }

  // Botão Editar: torna o campo editável
  let solucaoCampo = document.getElementById("solucao-texto");
  const btnEditar = document.getElementById("btnEditar");
  const btnSalvar = document.getElementById("btnSalvar");

  if (btnEditar && btnSalvar && solucaoCampo) {
    btnEditar.addEventListener("click", () => {
      // Mantém o estilo e apenas troca para textarea preservando o data-solucao-id
      if (solucaoCampo.tagName !== "TEXTAREA") {
        const textarea = document.createElement("textarea");
        textarea.id = "solucao-texto";
        textarea.className = solucaoCampo.className;
        textarea.value = solucaoCampo.textContent;
        textarea.rows = 5;
        // preserva o id da solução
        if (solucaoCampo.dataset.solucaoId) {
          textarea.dataset.solucaoId = solucaoCampo.dataset.solucaoId;
        }
        solucaoCampo.parentNode.replaceChild(textarea, solucaoCampo);
        solucaoCampo = textarea;
      }

      solucaoCampo.removeAttribute("readonly");
      solucaoCampo.focus();
      btnEditar.style.display = "none";
      btnSalvar.style.display = "inline-block";
    });

    // Substitui alerts por mensagem discreta abaixo da solução (sem alterar layout / botões)
    function showFeedback(msg, tipo = "ok") {
      let msgEl = document.getElementById("solucaoMsg");
      if (!msgEl) {
        msgEl = document.createElement("span");
        msgEl.id = "solucaoMsg";
        msgEl.style.display = "block";
        msgEl.style.marginTop = "6px";
        msgEl.style.fontSize = ".8rem";
        msgEl.style.fontWeight = "500";
        // Insere logo após o texto da solução
        const solucaoEl = document.getElementById("solucao-texto");
        solucaoEl?.parentElement?.insertBefore(msgEl, solucaoEl.nextSibling);
      }
      msgEl.textContent = msg;
      // Estilo mínimo sem mexer no layout existente
      if (tipo === "ok") {
        msgEl.style.color = "#1f7a31";
      } else {
        msgEl.style.color = "#a12626";
      }
      // Fade automático após alguns segundos (opcional)
      clearTimeout(msgEl._fadeTimer);
      msgEl.style.opacity = "1";
      msgEl._fadeTimer = setTimeout(() => {
        msgEl.style.transition = "opacity .6s";
        msgEl.style.opacity = "0";
      }, 4000);
    }

    // Ajuste no salvar (remover alert e usar showFeedback)
    btnSalvar.addEventListener("click", async () => {
      const campo = document.getElementById("solucao-texto");
      const textoSolucao = (campo.tagName === "TEXTAREA" ? campo.value : campo.textContent).trim();

      if (!textoSolucao) {
        showFeedback("Digite uma solução antes de salvar.", "erro");
        return;
      }
      if (!chamadoAtual?.idChamado && !chamadoAtual?.id) {
        showFeedback("ID do chamado não identificado.", "erro");
        return;
      }

      try {
        const idChamado = chamadoAtual.idChamado || chamadoAtual.id;

        // Tenta obter o id da solução
        let idSolucao =
          campo.dataset.solucaoId ||
          chamadoAtual.solucao?.id ||
          chamadoAtual.solucao?.idSolucao ||
          null;

        console.log("DEBUG:", { idChamado, idSolucao, textoSolucao });

        if (idSolucao) {
          // PATCH: id como query param, body é string direta
          console.log(`PATCH /solucao?id=${idSolucao}`);
          const resp = await api.patch(`/solucao?id=${idSolucao}`,
            JSON.stringify(textoSolucao),
            { headers: { 'Content-Type': 'application/json' } }
          );
          console.log("Resposta PATCH:", resp.data);
        } else {
          // POST: mantém objeto { idChamado, descricao }
          console.log("POST /solucao");
          const resp = await api.post(`/solucao`, { 
            idChamado: Number(idChamado), 
            descricao: textoSolucao 
          });
          console.log("Resposta POST:", resp.data);
          
          idSolucao = resp.data?.id || resp.data?.idSolucao || null;
          console.log("ID criado:", idSolucao);
        }

        // Atualiza estado
        if (!chamadoAtual.solucao) chamadoAtual.solucao = {};
        chamadoAtual.solucao.id = idSolucao;
        chamadoAtual.solucao.descricao = textoSolucao;

        // Volta para <p>
        let novoEl = document.getElementById("solucao-texto");
        if (novoEl.tagName === "TEXTAREA") {
          const p = document.createElement("p");
          p.id = "solucao-texto";
          p.className = novoEl.className;
          p.textContent = textoSolucao;
          if (idSolucao) p.dataset.solucaoId = String(idSolucao);
          novoEl.parentNode.replaceChild(p, novoEl);
        } else {
          novoEl.textContent = textoSolucao;
          if (idSolucao) novoEl.dataset.solucaoId = String(idSolucao);
        }

        btnSalvar.style.display = "none";
        btnEditar.style.display = "inline-block";
        showFeedback("Solução salva com sucesso.", "ok");
        
      } catch (error) {
        console.error("ERRO:", error?.response?.data || error?.message);
        showFeedback(`Erro: ${error?.response?.data?.message || error?.message || 'Falha'}`, "erro");
      }
    });
  }

  // Carrega chamado ao abrir página
  carregarChamado();

  // Botão sair
  const btnSairPagina = document.querySelector(".btn-sair");
  if (btnSairPagina) {
    btnSairPagina.addEventListener("click", () => {
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



