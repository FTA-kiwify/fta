export function sidebar() {
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
          class="sidebar-link active"
        >
          🏠 Dashboard
        </a>

        <a
          href="/portal/collaborators"
          class="sidebar-link"
        >
          👥 Colaboradores
        </a>

        <a
          href="/portal/projects"
          class="sidebar-link"
        >
          📁 Projetos
        </a>

        <a
          href="/portal/teams"
          class="sidebar-link"
        >
          👨‍💼 Times
        </a>

        <a
          href="/portal/reports"
          class="sidebar-link"
        >
          📊 Relatórios
        </a>

      </nav>

    </aside>
  `;
}