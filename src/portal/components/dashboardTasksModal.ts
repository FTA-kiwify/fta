import { taskRow } from "./taskRow";

type DashboardTasksModalProps = {
  title: string;
  tasks: any[];
  completed?: boolean;
};

export function dashboardTasksModal({
  title,
  tasks,
  completed = false,
}: DashboardTasksModalProps) {

  return `
    <div style="padding:32px;">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:28px;
        "
      >

        <h2 style="margin:0;">
          ${title}
        </h2>

        <button
          onclick="closePortalModal()"
          style="
            border:none;
            background:none;
            font-size:28px;
            cursor:pointer;
            color:#6B7280;
          "
        >
          ✕
        </button>

      </div>

      ${
        tasks.length

          ? tasks.map(task =>

              completed

                ? taskRow({
                    id: task.task.id,
                    title: task.task.title,
                    subtitle: "Concluída hoje",
                    rightText: new Date(task.createdAt).toLocaleTimeString(
                      "pt-BR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    ),
                    urgency: task.task.urgency,
                  })

                : taskRow({
                    id: task.id,
                    title: task.title,
                    subtitle: `📁 ${task.project?.name ?? "Sem projeto"}`,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                  })

            ).join("")

          : `
            <p>
              Nenhuma tarefa encontrada.
            </p>
          `
      }

    </div>
  `;

}