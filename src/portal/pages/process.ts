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
    gap:16px;
    align-items:center;
    margin-top:16px;
    color:#6B7280;
    font-size:14px;
  "
>

  <span>
    📝 ${process.tasks.length} tarefa${process.tasks.length !== 1 ? "s" : ""} pendente${process.tasks.length !== 1 ? "s" : ""}
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
    gap:16px;
    margin-top:32px;
    flex-wrap:wrap;
  "
>

          <a
  href="${process.notionPageUrl}"
  target="_blank"
  class="button"
  style="
    min-width:180px;
    justify-content:center;
  "
>
            📖 Abrir no Notion
          </a>

          <a
  href="javascript:void(0)"
  class="button"
  style="
    min-width:180px;
    justify-content:center;
  "
  onclick="openDocumentation('${process.id}')"
>
  📚 Documentação
</a>

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
            Tarefas pendentes
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

        ${process.tasks.length === 0

      ? `
                <p
                  style="
                    color:#6B7280;
                    margin:0;
                  "
                >
                  Nenhuma tarefa pendente.
                </p>
              `

      : process.tasks.map((task: any) =>

        upcomingTask({

          id: task.id,

          title: task.title,

          responsible: task.responsibleName,

          urgency: task.urgency,

          deadlineTime: task.deadlineTime,

        })

      ).join("")
    }

      </div>

    </div>

  `;

}