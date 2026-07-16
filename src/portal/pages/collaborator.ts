import type { CollaboratorDetails } from "../../services/portal/collaboratorDetailsService";
import { taskRow } from "../components/taskRow";
import { accordion } from "../components/accordion";
import { statCard } from "../components/statCard";

export function collaboratorPage(
  collaborator: CollaboratorDetails
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const todayTasks = collaborator.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= today &&
    new Date(task.term) < tomorrow
  );

  const tomorrowTasks = collaborator.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= tomorrow &&
    new Date(task.term) < dayAfter
  );

  const futureTasks = collaborator.tasks.filter(task =>
    task.term &&
    new Date(task.term) >= dayAfter
  );

  return `


    <div class="dashboard-grid">

  ${collaborator.isTeam
  ? statCard({
      title: "Membros",
      value: collaborator.members?.length ?? 0,
      subtitle: "No time",
      icon: "👥",
      onclick: `openPortalModal('/portal/teams/${collaborator.slackUserId}/members/modal')`,
    })
  : ""
}

  ${statCard({
    title: "Tarefas abertas",
    value: collaborator.totalTasks,
    subtitle: "Pendentes",
    icon: "📋",
    onclick: collaborator.isTeam
  ? `openPortalModal('/portal/teams/${collaborator.slackUserId}/tasks/pending/modal')`
  : `openPortalModal('/portal/collaborators/${collaborator.slackUserId}/tasks/pending/modal')`,
  })}

  ${statCard({
    title: "Vencem hoje",
    value: collaborator.todayTasks,
    subtitle: "Para hoje",
    icon: "📅",
    color: "#F59E0B",
    onclick: collaborator.isTeam
  ? `openPortalModal('/portal/teams/${collaborator.slackUserId}/tasks/today/modal')`
  : `openPortalModal('/portal/collaborators/${collaborator.slackUserId}/tasks/today/modal')`,
  })}

</div>

    <div
      class="card"
      style="margin-top:28px;"
    >

      <h2 style="margin-bottom:24px;">
        📅 Próximas tarefas
      </h2>

      ${todayTasks.length
      ? accordion({
        id: "today-tasks",
        title: "Hoje",
        count: todayTasks.length,
        body: todayTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `📁 ${task.project ?? "Sem projeto"}`,
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
        id: "tomorrow-tasks",
        title: "Amanhã",
        count: tomorrowTasks.length,
        body: tomorrowTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `📁 ${task.project ?? "Sem projeto"}`,
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
        id: "future-tasks",
        title: "Futuras",
        count: futureTasks.length,
        body: futureTasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `📁 ${task.project ?? "Sem projeto"}`,
              deadlineTime: task.deadlineTime,
              rightText: new Date(task.term!).toLocaleDateString("pt-BR"),
              urgency: task.urgency,
            })
          )
          .join(""),
      })
      : ""
    }

${collaborator.tasks.length === 0
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
      style="margin-top:28px;"
    >

      <h2 style="margin-bottom:20px;">
        📁 Projetos
      </h2>

      ${collaborator.projects
      .map(project => `
    <div
      onclick="openPortalModal('/portal/projects/${project.id}/modal')"
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:16px 0;
        border-bottom:1px solid #E5E7EB;
        cursor:pointer;
        transition:background .15s;
      "
      onmouseover="this.style.background='#F9FAFB'"
      onmouseout="this.style.background='transparent'"
    >

      <div style="font-weight:600;">
        📁 ${project.name}
      </div>

      <div
        style="
          color:#6B7280;
          font-weight:600;
        "
      >
        ${project.count}
      </div>

    </div>
  `)
      .join("")
    }

    </div>

    <div
  class="card"
  style="margin-top:28px;"
>

  <h2 style="margin-bottom:20px;">
    🔁 Recorrências
  </h2>

  ${collaborator.recurrences.map(group =>

      accordion({
        id: `recurrence-${group.name}`,
        title: group.name,
        count: group.tasks.length,
        body: group.tasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `📁 ${task.project ?? "Sem projeto"}`,
              deadlineTime: task.deadlineTime,
              urgency: task.urgency,
            })
          )
          .join(""),
      })

    ).join("")}
    

</div>

<div
  class="card"
  style="margin-top:28px;"
>

  <h2 style="margin-bottom:20px;">
    🔥 Prioridades
  </h2>

  ${collaborator.urgencies.map(group =>

      accordion({
        id: `urgency-${group.name}`,
        title: group.name,
        count: group.tasks.length,
        body: group.tasks
          .map(task =>
            taskRow({
              id: task.id,
              title: task.title,
              subtitle: `📁 ${task.project ?? "Sem projeto"}`,
              deadlineTime: task.deadlineTime,
              urgency: task.urgency,
            })
          )
          .join(""),
      })

    ).join("")}

</div>

${collaborator.isTeam ? `

<div
  class="card"
  style="
    margin-top:28px;
    border:1px solid #FECACA;
  "
>

  <h2 style="color:#DC2626;">
    🗑 Zona de perigo
  </h2>

  <p style="margin-bottom:20px;">
    Exclua este time caso ele não seja mais utilizado.
  </p>

  <button
    onclick="deleteTeam('${collaborator.slackUserId}')"
    style="
      background:#DC2626;
      color:white;
      border:none;
      padding:12px 18px;
      border-radius:10px;
      cursor:pointer;
      font-weight:600;
    "
  >
    Excluir time
  </button>

</div>

` : ""}

  `;

}