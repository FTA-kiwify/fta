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
  width:min(var(--portal-modal-width,720px), 100%);
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
      async function openPortalModal(url, width) {
        const modal = document.getElementById("portal-modal");
        const content = document.getElementById("portal-modal-content");

        if (!modal || !content) return;

        content.style.setProperty(
  "--portal-modal-width",
  width || "720px"
);

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

      window.selectTeamType = function(type) {

  const departmentCard = document.getElementById("department-card");
  const subteamCard = document.getElementById("subteam-card");
  const departmentContainer = document.getElementById("department-container");

  if (!departmentCard || !subteamCard || !departmentContainer) {
    return;
  }

  departmentCard.classList.toggle(
    "active",
    type === "department"
  );

  subteamCard.classList.toggle(
    "active",
    type === "subteam"
  );

  departmentContainer.style.display =
    type === "subteam"
      ? "block"
      : "none";

};

window.createTeam = async function () {

  const name = document
    .getElementById("team-name")
    ?.value
    ?.trim();

  const description = document
    .getElementById("team-description")
    ?.value
    ?.trim();

  const isSubteam = document
    .getElementById("subteam-card")
    ?.classList
    ?.contains("active");

  const group = isSubteam
    ? document.getElementById("team-group")?.value
    : null;

  if (!name) {
    alert("Informe o nome do time.");
    return;
  }

  if (isSubteam && !group) {
    alert("Selecione o departamento.");
    return;
  }

  try {

    const response = await fetch("/portal/teams", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        description,
        group,
      }),

    });

    if (!response.ok) {
      throw new Error();
    }

    closePortalModal();

    window.location.reload();

  } catch {

    alert("Não foi possível criar o time.");

  }

};

window.addMember = async function(teamId, slackUserId) {

  try {

    const response = await fetch(
  \`/portal/teams/\${teamId}/members\`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slackUserId,
    }),
  }
);

  if (!response.ok) {
    throw new Error();
  }

  closePortalModal();

window.location.reload();

} catch {

  alert("Não foi possível adicionar o membro.");

}

};

window.removeMember = async function(teamId, slackUserId) {

  if (!confirm("Remover este colaborador do time?")) {
    return;
  }

  try {

    const response = await fetch(
      \`/portal/teams/\${teamId}/members/\${slackUserId}\`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error();
    }

    closePortalModal();

window.location.reload();

  } catch {

    alert("Não foi possível remover o membro.");

  }

};

window.deleteTeam = async function(teamId) {

  if (!confirm("Deseja excluir este time?")) {
    return;
  }

  try {

    const response = await fetch(
      \`/portal/teams/\${teamId}\`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {

      const body = await response.json();

      alert(body.error);

      return;

    }

    closePortalModal();

    window.location.href = "/portal/teams";

  } catch {

    alert("Não foi possível excluir o time.");

  }

};

window.openDocumentation = function(processId) {

  openPortalModal(
    "/portal/processes/" + processId + "/documentation",
    "1200px"
  );

};

document.addEventListener("keydown", function (event) {
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