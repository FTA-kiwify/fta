import type { ProjectDetails } from "../../services/portal/projectDetailsService";
import { taskRow } from "../components/taskRow";
import { statCard } from "../components/statCard";
import { accordion } from "../components/accordion";

export function projectPage(
  project: ProjectDetails
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const pendingTasks = project.tasks.filter(
    task =>
      task.status !== "done" &&
      task.status !== "cancelled"
  );

  const completedTasks = project.tasks.filter(
    task => task.status === "done"
  );

  const todayTasks = pendingTasks.filter(task =>
    task.term &&
    new Date(task.term) >= today &&
    new Date(task.term) < tomorrow
  );

  const tomorrowTasks = pendingTasks.filter(task =>
    task.term &&
    new Date(task.term) >= tomorrow &&
    new Date(task.term) < dayAfter
  );

  const futureTasks = pendingTasks.filter(task =>
    task.term &&
    new Date(task.term) >= dayAfter
  );

  return `

    <div
      class="card"
      style="margin-bottom:24px;"
    >

      <p
        style="
          margin:0;
          color:#6B7280;
          line-height:1.7;
        "
      >
        ${project.description ??
    "Nenhuma descrição cadastrada para este projeto."
    }
      </p>

    </div>

    <div class="dashboard-grid">

  ${statCard({
      title: "Pendentes",
      value: project.pendingTasks,
      subtitle: "Em aberto",
      icon: "📋",
      onclick: `openPortalModal('/portal/projects/${project.id}/tasks/pending/modal')`,
    })}

  ${statCard({
      title: "Vencem hoje",
      value: project.todayTasks,
      subtitle: "Para hoje",
      icon: "📅",
      color: "#F59E0B",
      onclick: `openPortalModal('/portal/projects/${project.id}/tasks/today/modal')`,
    })}

  ${statCard({
      title: "Concluídas",
      value: project.completedTasks,
      subtitle: "Finalizadas",
      icon: "✅",
      color: "#22C55E",
      onclick: `openPortalModal('/portal/projects/${project.id}/tasks/completed/modal')`,
    })}

  ${statCard({
      title: "Membros",
      value: project.members.length,
      subtitle: "Responsáveis",
      icon: "👥",
      color: "#3B82F6",
      onclick: `openPortalModal('/portal/projects/${project.id}/members/modal')`,
    })}

</div>

    <div
      class="card"
      style="margin-top:24px;"
    >

      <h2 style="margin-bottom:20px;">
        📅 Pendentes
      </h2>

      ${todayTasks.length
      ? accordion({
        id: "project-today",
        title: "Hoje",
        count: todayTasks.length,
        body: todayTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `👤 ${task.responsible}`,
              deadlineTime: task.deadlineTime,
              urgency: task.urgency,
            })
          )
          .join(""),
      })
      : ""
    }

      ${tomorrowTasks.length
      ? accordion({
        id: "project-tomorrow",
        title: "Amanhã",
        count: tomorrowTasks.length,
        body: tomorrowTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `👤 ${task.responsible}`,
              deadlineTime: task.deadlineTime,
              urgency: task.urgency,
            })
          )
          .join(""),
      })
      : ""
    }

      ${futureTasks.length
      ? accordion({
        id: "project-future",
        title: "Futuras",
        count: futureTasks.length,
        body: futureTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `👤 ${task.responsible}`,
              deadlineTime: task.deadlineTime,
              rightText: task.term
                ? new Date(task.term).toLocaleDateString("pt-BR")
                : "",
              urgency: task.urgency,
            })
          )
          .join(""),
      })
      : ""
    }

      ${pendingTasks.length === 0
      ? `
            <p>
              Nenhuma tarefa pendente.
            </p>
          `
      : ""
    }

    </div>

    <div
      class="card"
      style="margin-top:24px;"
    >

      <h2 style="margin-bottom:20px;">
        ✅ Concluídas
      </h2>

      ${completedTasks.length
      ? accordion({
        id: "project-completed",
        title: "Concluídas",
        count: completedTasks.length,
        body: completedTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `👤 ${task.responsible}`,
              deadlineTime: task.deadlineTime,
              urgency: task.urgency,
            })
          )
          .join(""),
      })
      : `
            <p>
              Nenhuma tarefa concluída.
            </p>
          `
    }

    </div>

  `;

}