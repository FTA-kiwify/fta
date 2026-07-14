export function sidebar(active: string = "dashboard") {

  const item = (key: string) =>
    key === active ? "sidebar-link active" : "sidebar-link";

  return `
    <aside
      style="
        width:260px;
        background:#0F7A55;
        color:white;
        padding:28px 20px;
        display:flex;
        flex-direction:column;
      "
    >

      <div
        style="
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:42px;
        "
      >

        <img
          src="/public/logo.webp"
          style="
            width:48px;
            height:48px;
            object-fit:contain;
          "
        />

        <div>

          <div
            style="
              font-size:28px;
              font-weight:700;
              line-height:1;
            "
          >
            FTA
          </div>

          <div
            style="
              font-size:14px;
              opacity:.8;
              margin-top:4px;
            "
          >
            Manager
          </div>

        </div>

      </div>

      <nav
        style="
          display:flex;
          flex-direction:column;
          gap:8px;
        "
      >

        <a
          href="/portal"
          class="${item("dashboard")}"
        >
          🏠 Dashboard
        </a>

        <a
          href="/portal/collaborators"
          class="${item("collaborators")}"
        >
          👥 Colaboradores
        </a>

        <a
          href="/portal/projects"
          class="${item("projects")}"
        >
          📁 Projetos
        </a>

        <a
          href="/portal/teams"
          class="${item("teams")}"
        >
          👨‍💼 Times
        </a>

        <a
          href="/portal/reports"
          class="${item("reports")}"
        >
          📊 Relatórios
        </a>

      </nav>

    </aside>
  `;
}