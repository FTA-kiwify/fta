export function processPage(
  process: any
) {

  return `

    <div
      style="
        display:flex;
        flex-direction:column;
        gap:24px;
      "
    >

      <div
        class="card"
        style="
          padding:40px;
        "
      >

        <h1
          style="
            margin:0;
            font-size:36px;
            line-height:1.2;
          "
        >
          📚 ${process.title}
        </h1>

        <div
          style="
            display:flex;
            gap:10px;
            margin-top:20px;
            flex-wrap:wrap;
          "
        >

          <span
            style="
              background:#DCFCE7;
              color:#166534;
              padding:6px 12px;
              border-radius:999px;
              font-size:13px;
              font-weight:600;
            "
          >
            ${process.notionVertical}
          </span>

          ${process.theme
      ? `
                <span
                  style="
                    background:#EDE9FE;
                    color:#6D28D9;
                    padding:6px 12px;
                    border-radius:999px;
                    font-size:13px;
                    font-weight:600;
                  "
                >
                  ${process.theme}
                </span>
              `
      : ""
    }

        </div>

        <div
          style="
            display:flex;
            gap:12px;
            margin-top:28px;
            flex-wrap:wrap;
          "
        >

          <a
            href="${process.notionPageUrl}"
            target="_blank"
            class="button"
          >
            📖 Abrir no Notion
          </a>

          <button
            class="button button-secondary"
            onclick="openDocumentation('${process.id}')"
          >
            📚 Ver documentação
          </button>

        </div>

      </div>

      <div
        style="
          display:grid;
          grid-template-columns:2fr 320px;
          gap:24px;
        "
      >

        <div class="card">

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-bottom:24px;
            "
          >

            <h2
              style="
                margin:0;
              "
            >
              Tarefas relacionadas
            </h2>

            <span
              style="
                color:#6B7280;
                font-size:14px;
              "
            >
              ${process.tasks.length} tarefa(s)
            </span>

          </div>

          ${process.tasks.length === 0

      ? `
                <div
                  style="
                    color:#6B7280;
                  "
                >
                  Nenhuma tarefa vinculada a este processo.
                </div>
              `

      : process.tasks.map((task: any) => `

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:14px 0;
                    border-bottom:1px solid #E5E7EB;
                  "
                >

                  <div>

                    <a
                      href="/portal/tasks/${task.id}"
                      style="
                        font-weight:600;
                        color:#111827;
                        text-decoration:none;
                      "
                    >
                      ${task.title}
                    </a>

                    <div
                      style="
                        color:#6B7280;
                        font-size:14px;
                        margin-top:4px;
                      "
                    >
                      ${task.responsible ?? ""}
                    </div>

                  </div>

                  <span
                    style="
                      background:${task.status === "done"
          ? "#DCFCE7"
          : task.status === "pending"
            ? "#FEF3C7"
            : "#F3F4F6"
        };
                      color:${task.status === "done"
          ? "#166534"
          : task.status === "pending"
            ? "#92400E"
            : "#374151"
        };
                      padding:4px 10px;
                      border-radius:999px;
                      font-size:12px;
                      font-weight:600;
                    "
                  >
                    ${task.status === "done"
          ? "Concluída"
          : task.status === "pending"
            ? "Pendente"
            : task.status === "blocked"
              ? "Bloqueada"
              : task.status
        }
                  </span>

                </div>

              `).join("")
    }

        </div>

       <div class="card">

  <h2
    style="
      margin-top:0;
      margin-bottom:24px;
    "
  >
    Resumo
  </h2>

  <div
    style="
      text-align:center;
      margin-bottom:24px;
    "
  >

    <div
      style="
        font-size:38px;
        font-weight:700;
        color:#111827;
      "
    >
      ${process.tasks.length}
    </div>

    <div
      style="
        color:#6B7280;
        font-size:14px;
      "
    >
      tarefa(s) vinculada(s)
    </div>

  </div>

  <hr
    style="
      border:none;
      border-top:1px solid #E5E7EB;
      margin:20px 0;
    "
  />

  <div style="margin-bottom:18px;">

    <div
      style="
        color:#6B7280;
        font-size:13px;
      "
    >
      Time
    </div>

    <strong>
      ${process.team?.name ?? "Não vinculado"}
    </strong>

  </div>

  <div style="margin-bottom:18px;">

    <div
      style="
        color:#6B7280;
        font-size:13px;
      "
    >
      Processo
    </div>

    <a
      href="${process.notionPageUrl}"
      target="_blank"
      style="
        font-weight:600;
        text-decoration:none;
      "
    >
      Abrir no Notion ↗
    </a>

  </div>

  <div>

    <div
      style="
        color:#6B7280;
        font-size:13px;
      "
    >
      Status
    </div>

    <span
      style="
        color:#166534;
        font-weight:600;
      "
    >
      ● Sincronizado
    </span>

  </div>

</div>

      </div>

    </div>

  `;

}