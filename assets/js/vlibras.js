window.addEventListener("DOMContentLoaded", () => {
  // Cria o container do VLibras
  const vlibrasDiv = document.createElement("div");
  vlibrasDiv.innerHTML = `
    <div vw class="enabled">
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  `;
  document.body.appendChild(vlibrasDiv);

  // Adiciona o script do VLibras
  const script = document.createElement("script");
  script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
  script.onload = () => {
    new window.VLibras.Widget("https://vlibras.gov.br/app");
  };
  document.body.appendChild(script);
});
