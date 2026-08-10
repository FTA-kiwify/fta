type TopbarProps = {
  title: string;
  searchPlaceholder?: string;

  user?: {
    name: string;
    email?: string;
    image?: string;
  };
};

export function topbar({
  title,
  searchPlaceholder,
  user,
}: TopbarProps) {
  return `
<header
  style="
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:24px 32px;
    background:white;
    border-bottom:1px solid #E5E7EB;
  "
>
  <div
    style="
      display:flex;
      align-items:center;
      gap:12px;
    "
  >
    <button
      type="button"
      id="portal-back-button"
      aria-label="Voltar"
      title="Voltar"
      style="
        display:none;
        align-items:center;
        border:none;
        background:transparent;
        padding:6px 8px 6px 0;
        cursor:pointer;
        color:#4B5563;
        font-size:14px;
        font-weight:600;
        white-space:nowrap;
      "
    >
      ← Voltar
    </button>

    <h2
      style="
        font-size:24px;
        margin:0;
      "
    >
      ${title}
    </h2>
  </div>

  <div
    style="
      display:flex;
      align-items:center;
      gap:16px;
    "
  >
    ${
      searchPlaceholder
        ? `
          <input
            id="portal-search"
            placeholder="${searchPlaceholder}"
            style="
              padding:10px 14px;
              border-radius:12px;
              border:1px solid #D1D5DB;
              width:240px;
              font-size:14px;
              outline:none;
            "
          />
        `
        : ""
    }

    ${
      user
        ? `
          <div
            id="portal-user"
            style="
              position:relative;
              display:flex;
              align-items:center;
              gap:12px;
              cursor:pointer;
              user-select:none;
            "
          >
            ${
              user.image
                ? `
                  <img
                    src="${user.image}"
                    alt="${user.name}"
                    style="
                      width:42px;
                      height:42px;
                      border-radius:50%;
                      object-fit:cover;
                    "
                  />
                `
                : `
                  <div
                    style="
                      width:42px;
                      height:42px;
                      border-radius:50%;
                      background:#5B6CFF;
                      color:white;
                      display:flex;
                      justify-content:center;
                      align-items:center;
                      font-weight:700;
                      font-size:16px;
                    "
                  >
                    ${user.name.charAt(0).toUpperCase()}
                  </div>
                `
            }

            <div
              style="
                display:flex;
                flex-direction:column;
              "
            >
              <span
                style="
                  font-size:14px;
                  font-weight:600;
                "
              >
                ${user.name}
              </span>

              ${
                user.email
                  ? `
                    <span
                      style="
                        font-size:12px;
                        color:#6B7280;
                      "
                    >
                      ${user.email}
                    </span>
                  `
                  : ""
              }
            </div>

            <span
              style="
                font-size:12px;
                color:#6B7280;
              "
            >
              ▼
            </span>

            <div
              id="portal-user-menu"
              style="
                display:none;
                position:absolute;
                right:0;
                top:58px;
                width:240px;
                background:white;
                border:1px solid #E5E7EB;
                border-radius:12px;
                box-shadow:0 10px 30px rgba(0,0,0,.12);
                overflow:hidden;
                z-index:1000;
              "
            >
              <div
                style="
                  padding:16px;
                "
              >
                <div
                  style="
                    font-weight:600;
                    margin-bottom:4px;
                  "
                >
                  ${user.name}
                </div>

                ${
                  user.email
                    ? `
                      <div
                        style="
                          font-size:13px;
                          color:#6B7280;
                        "
                      >
                        ${user.email}
                      </div>
                    `
                    : ""
                }
              </div>

              <a
                href="/portal/logout"
                style="
                  display:block;
                  padding:14px 16px;
                  border-top:1px solid #E5E7EB;
                  text-decoration:none;
                  color:#DC2626;
                  font-weight:600;
                "
              >
                🚪 Sair
              </a>
            </div>
          </div>
        `
        : ""
    }
  </div>
</header>

<script>
  (() => {
    // Menu do usuário
    const user = document.getElementById("portal-user");
    const menu = document.getElementById("portal-user-menu");

    if (user && menu) {
      user.addEventListener("click", (e) => {
        e.stopPropagation();

        menu.style.display =
          menu.style.display === "block"
            ? "none"
            : "block";
      });

      document.addEventListener("click", () => {
        menu.style.display = "none";
      });
    }

    // Botão Voltar
    const backButton = document.getElementById("portal-back-button");

    if (!backButton) return;

    const currentPath =
      window.location.pathname.replace(/\\/+$/, "") || "/portal";

    // Dashboard é a raiz do portal: não mostra Voltar.
    if (currentPath === "/portal") {
      return;
    }

    backButton.style.display = "inline-flex";

    backButton.addEventListener("click", () => {
      const referrer = document.referrer;

      try {
        if (referrer) {
          const previousUrl = new URL(referrer);

          // Só usa o histórico se a página anterior também era do portal.
          if (
            previousUrl.origin === window.location.origin &&
            previousUrl.pathname.startsWith("/portal")
          ) {
            window.history.back();
            return;
          }
        }
      } catch (_) {}

      // Se entrou direto pela URL, volta para o dashboard.
      window.location.href = "/portal";
    });
  })();
</script>
`;
}