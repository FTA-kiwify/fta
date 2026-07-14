import type { CollaboratorDetails } from "../../services/portal/collaboratorDetailsService";
import { taskRow } from "../components/taskRow";
import { accordion } from "../components/accordion";

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
    <div class="card">

      <h1>👤 ${collaborator.name}</h1>

      <p>
        Resumo do colaborador
      </p>

    </div>

    <div class="dashboard-grid">

      <div class="stat-card">

        <div>

          <div class="stat-title">
            Tarefas abertas
          </div>

          <div class="stat-value">
            ${collaborator.totalTasks}
          </div>

        </div>

        <div
          class="stat-icon"
          style="background:#27C27A;"
        >
          📋
        </div>

      </div>

      <div class="stat-card">

        <div>

          <div class="stat-title">
            Vencem hoje
          </div>

          <div class="stat-value">
            ${collaborator.todayTasks}
          </div>

        </div>

        <div
          class="stat-icon"
          style="background:#F59E0B;"
        >
          📅
        </div>

      </div>

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

  `;

}