export function modalContainer() {
  return `
    <div
      id="portal-modal"
      style="
        display:none;
        position:fixed;
        inset:0;
        z-index:9999;
        align-items:center;
        justify-content:center;
        padding:24px;
        background:rgba(15,23,42,.55);
      "
      onclick="closePortalModal(event)"
    >

      <div
        id="portal-modal-content"
        style="
          width:min(720px, 100%);
          max-height:88vh;
          overflow:auto;
          background:#FFFFFF;
          border-radius:20px;
          box-shadow:0 24px 70px rgba(15,23,42,.28);
        "
        onclick="event.stopPropagation()"
      >
      </div>

    </div>

    <script>
      async function openPortalModal(url) {
        const modal = document.getElementById("portal-modal");
        const content = document.getElementById("portal-modal-content");

        if (!modal || !content) return;

        content.innerHTML = \`
          <div style="padding:32px; text-align:center;">
            Carregando...
          </div>
        \`;

        modal.style.display = "flex";
        document.body.style.overflow = "hidden";

        try {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error("Não foi possível carregar os detalhes.");
          }

          content.innerHTML = await response.text();
        } catch (error) {
          content.innerHTML = \`
            <div style="padding:32px;">
              <h2 style="margin-bottom:12px;">Erro</h2>
              <p>Não foi possível carregar os detalhes.</p>
            </div>
          \`;
        }
      }

      function closePortalModal(event) {
        if (event && event.target?.id !== "portal-modal") {
          return;
        }

        const modal = document.getElementById("portal-modal");
        const content = document.getElementById("portal-modal-content");

        if (!modal || !content) return;

        modal.style.display = "none";
        content.innerHTML = "";
        document.body.style.overflow = "";
      }

      document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          const modal = document.getElementById("portal-modal");
          const content = document.getElementById("portal-modal-content");

          if (!modal || modal.style.display !== "flex") return;

          modal.style.display = "none";
          content.innerHTML = "";
          document.body.style.overflow = "";
        }
      });
    </script>
  `;
}