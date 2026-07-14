import type { ProjectDetails } from "../../services/portal/projectDetailsService";
import { taskRow } from "./taskRow";

export function projectModal(
  project: ProjectDetails
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = project.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= today &&
    new Date(task.term) < tomorrow
  );

  return `

    <div style="padding:32px;">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          margin-bottom:30px;
        "
      >

        <div>

          <h2
            style="
              margin:0 0 10px;
              font-size:28px;
            "
          >
            📁 ${project.name}
          </h2>

          <span
            style="
              background:${project.status === "active" ? "#DCFCE7" : "#E5E7EB"};
              color:${project.status === "active" ? "#15803D" : "#6B7280"};
              padding:4px 10px;
              border-radius:999px;
              font-size:13px;
              font-weight:600;
            "
          >
            ${project.status === "active" ? "🟢 Ativo" : project.status}
          </span>

        </div>

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

      <div
        style="
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:16px;
          margin-bottom:28px;
        "
      >

        <div class="stat-card">

          <div>

            <div class="stat-title">
              Tarefas abertas
            </div>

            <div class="stat-value">
              ${project.totalTasks}
            </div>

          </div>

        </div>

        <div class="stat-card">

          <div>

            <div class="stat-title">
              Membros
            </div>

            <div class="stat-value">
              ${project.members.length}
            </div>

          </div>

        </div>

        <div class="stat-card">

          <div>

            <div class="stat-title">
              Vencem hoje
            </div>

            <div class="stat-value">
              ${project.todayTasks}
            </div>

          </div>

        </div>

      </div>

      <h3
        style="
          margin-bottom:18px;
        "
      >
        📅 Próximas tarefas
      </h3>

      ${
        project.tasks.length

          ? project.tasks
              .slice(0, 8)
              .map(task =>
                taskRow({
                  id: task.id,
                  title: task.title,
                  subtitle: `👤 ${task.responsible}`,
                  urgency: task.urgency,
                  deadlineTime: task.deadlineTime,
                  rightText: task.term
                    ? new Date(task.term).toLocaleDateString("pt-BR")
                    : undefined,
                })
              )
              .join("")

          : `
              <p>
                Nenhuma tarefa pendente.
              </p>
            `

      }

    </div>

  `;

}