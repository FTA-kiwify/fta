import { upcomingTask } from "../components/upcomingTask";

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
            gap:14px;
            flex-wrap:wrap;
            margin-top:16px;
            color:#6B7280;
            font-size:14px;
          "
        >

          <span>
            📝 ${process.tasks.length} tarefa${process.tasks.length !== 1 ? "s" : ""}
          </span>

          <span>
            👥 ${process.team?.name ?? "Sem time"}
          </span>

          <span
            style="
              color:#16A34A;
              font-weight:600;
            "
          >
            ● Sincronizado
          </span>

        </div>

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

          ${
            process.theme
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
            class="button"
            onclick="openDocumentation('${process.id}')"
          >
            👁 Ver documentação
          </button>

        </div>

      </div>

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
            ${process.tasks.length}
          </span>

        </div>

        ${
          process.tasks.length === 0

            ? `
                <p
                  style="
                    color:#6B7280;
                    margin:0;
                  "
                >
                  Nenhuma tarefa vinculada.
                </p>
              `

            : process.tasks.map((task: any) =>

                upcomingTask({

                  id: task.id,

                  title: task.title,

                  responsible: task.responsible,

                  urgency: task.urgency,

                  deadlineTime: task.deadlineTime,

                })

              ).join("")
        }

      </div>

    </div>

  `;

}