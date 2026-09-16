import { upcomingTask } from "../components/upcomingTask";
import { accordion } from "../components/accordion";
import { getBrazilToday } from "../../utils/date";

export function processPage(
  process: any
) {

  const today = getBrazilToday();

  const tomorrow = new Date(today);
  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(
    dayAfter.getDate() + 1
  );

  const todayTasks =
    process.tasks.filter((task: any) =>
      task.term &&
      new Date(task.term) >= today &&
      new Date(task.term) < tomorrow
    );

  const tomorrowTasks =
    process.tasks.filter((task: any) =>
      task.term &&
      new Date(task.term) >= tomorrow &&
      new Date(task.term) < dayAfter
    );

  const futureTasks =
    process.tasks.filter((task: any) =>
      task.term &&
      new Date(task.term) >= dayAfter
    );


  const noTermTasks =
    process.tasks.filter((task: any) =>
      !task.term
    );

  const renderTasks = (tasks: any[]) =>
    tasks
      .map(task =>
        upcomingTask({
          id: task.id,
          title: task.title,
          responsible:
            task.responsibleName,
          urgency: task.urgency,
          deadlineTime:
            task.deadlineTime,
        })
      )
      .join("");

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
      : `
            
      }

              <div
                style="
                  margin-top:0;
                  margin-bottom:20px;
                "
              >
                <h3
                  style="
                    margin:0 0 14px;
                    font-size:18px;
                  "
                >
                  Hoje
                </h3>

                ${todayTasks.length
        ? renderTasks(todayTasks)
        : `
                        <p
                          style="
                            color:#6B7280;
                            margin:0;
                          "
                        >
                          Nenhuma tarefa para hoje.
                        </p>
                      `
      }
              </div>

              ${accordion({
        id: "process-tomorrow-tasks",
        title: "Amanhã",
        count: tomorrowTasks.length,
        body: tomorrowTasks.length
          ? renderTasks(tomorrowTasks)
          : `
                      <p style="color:#6B7280;">
                        Nenhuma tarefa para amanhã.
                      </p>
                    `,
      })}

              ${accordion({
        id: "process-future-tasks",
        title: "Futuras",
        count: futureTasks.length,
        body: futureTasks.length
          ? renderTasks(futureTasks)
          : `
                      <p style="color:#6B7280;">
                        Nenhuma tarefa futura.
                      </p>
                    `,
      })}

              ${noTermTasks.length
        ? accordion({
          id: "process-no-term-tasks",
          title: "Sem prazo",
          count: noTermTasks.length,
          body: renderTasks(
            noTermTasks
          ),
        })
        : ""
      }
            `
    }

      </div>

    </div>

  `;

}