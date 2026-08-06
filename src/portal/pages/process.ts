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

      <div class="card">

        <h1
          style="
            margin:0;
            font-size:32px;
          "
        >
          ${process.title}
        </h1>

        <div
          style="
            color:#6B7280;
            margin-top:10px;
          "
        >
          ${process.notionVertical}
          ${process.team ? `• ${process.team.name}` : ""}
        </div>

        ${process.theme
      ? `
              <div
                style="
                  margin-top:18px;
                  color:#374151;
                "
              >
                <strong>Tema:</strong> ${process.theme}
              </div>
            `
      : ""
    }

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

      <div class="card">

        <h2
          style="
            margin-top:0;
          "
        >
          Tarefas relacionadas
        </h2>

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

                    <div
                      style="
                        font-weight:600;
                      "
                    >
                      ${task.title}
                    </div>

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

                  <div>

                    ${task.status}

                  </div>

                </div>

            `).join("")
    }

      </div>

    </div>

  `;

}