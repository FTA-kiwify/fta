import type { ProjectDetails } from "../../services/portal/projectDetailsService";
import { taskRow } from "../components/taskRow";
import { statCard } from "../components/statCard";

export function projectPage(
  project: ProjectDetails
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const todayTasks = project.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= today &&
    new Date(task.term) < tomorrow
  );

  const tomorrowTasks = project.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= tomorrow &&
    new Date(task.term) < dayAfter
  );

  const futureTasks = project.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= dayAfter
  );

  return `
    <div class="card">

      <h1>📁 ${project.name}</h1>

      <p>
        Projeto ${project.status === "active" ? "ativo" : project.status}
      </p>

    </div>

    <div class="dashboard-grid">

      ${statCard({
        title: "Tarefas abertas",
        value: project.totalTasks,
        icon: "📋",
        color: "#27C27A",
      })}

      ${statCard({
        title: "Vencem hoje",
        value: project.todayTasks,
        icon: "📅",
        color: "#F59E0B",
      })}

      ${statCard({
        title: "Membros",
        value: project.members.length,
        icon: "👥",
        color: "#3B82F6",
      })}

    </div>

    <div
      class="card"
      style="margin-top:24px;"
    >

      <h2>Membros</h2>

      ${
        project.members.length === 0
          ? `
            <p>Nenhum membro neste projeto.</p>
          `
          : `
            <ul style="margin-top:16px;padding-left:20px;">
              ${project.members
                .map(member => `<li>${member}</li>`)
                .join("")}
            </ul>
          `
      }

    </div>

    <div
      class="card"
      style="margin-top:24px;"
    >

      <h2 style="margin-bottom:24px;">
        Tarefas
      </h2>

      ${
        todayTasks.length
          ? `
            <h3 style="margin-bottom:12px;">
              📅 Hoje
            </h3>

            ${todayTasks
              .map(task =>
                taskRow({
                  id: task.id,
                  title: task.title,
                  subtitle: `👤 ${task.responsible}`,
                  deadlineTime: task.deadlineTime,
                  urgency: task.urgency,
                })
              )
              .join("")}
          `
          : ""
      }

      ${
        tomorrowTasks.length
          ? `
            <h3 style="margin:24px 0 12px;">
              📅 Amanhã
            </h3>

            ${tomorrowTasks
              .map(task =>
                taskRow({
                  id: task.id,
                  title: task.title,
                  subtitle: `👤 ${task.responsible}`,
                  deadlineTime: task.deadlineTime,
                  urgency: task.urgency,
                })
              )
              .join("")}
          `
          : ""
      }

      ${
        futureTasks.length
          ? `
            <h3 style="margin:24px 0 12px;">
              📅 Futuras
            </h3>

            ${futureTasks
              .map(task =>
                taskRow({
                  id: task.id,
                  title: task.title,
                  subtitle: `👤 ${task.responsible}`,
                  deadlineTime: task.deadlineTime,
                  rightText: new Date(task.term!).toLocaleDateString("pt-BR"),
                  urgency: task.urgency,
                })
              )
              .join("")}
          `
          : ""
      }

      ${
        project.tasks.length === 0
          ? `
            <p>
              Nenhuma tarefa pendente neste projeto.
            </p>
          `
          : ""
      }

    </div>

  `;
}