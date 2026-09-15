import type { CollaboratorDetails } from "../../services/portal/collaboratorDetailsService";
import { taskRow } from "../components/taskRow";
import { accordion } from "../components/accordion";
import { statCard } from "../components/statCard";
import { dashboardSection } from "../components/dashboardSection";
import { upcomingTask } from "../components/upcomingTask";
import { completedTask } from "../components/completedTask";
import { getBrazilToday } from "../../utils/date";

export function collaboratorPage(
  collaborator: CollaboratorDetails
) {

  const today = getBrazilToday();

  const collaboratorStatus =
    collaborator.collaboratorStatus ?? "active";

  const isBackupActive =
    !collaborator.isTeam &&
    collaboratorStatus === "backup";

  const isInactive =
    !collaborator.isTeam &&
    collaboratorStatus === "inactive";

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const todayTasks = collaborator.tasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    return (
      task.term &&
      new Date(task.term) >= today &&
      new Date(task.term) < tomorrow
    );
  });

  const tomorrowTasks = collaborator.tasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    return (
      task.term &&
      new Date(task.term) >= tomorrow &&
      new Date(task.term) < dayAfter
    );
  });

  const futureTasks = collaborator.tasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    return (
      task.term &&
      new Date(task.term) >= dayAfter
    );
  });

  const onDemandTasks = collaborator.tasks.filter(
    task => task.taskType === "on_demand"
  );

  const collaboratorActions =
    collaborator.isTeam
      ? ""
      : `
      <div
        class="card"
        style="
          margin-bottom:28px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          flex-wrap:wrap;
        "
      >
        <div>
          <div style="font-size:14px;color:#6B7280;margin-bottom:6px;">
            Status do colaborador
          </div>

          <div style="font-size:18px;font-weight:700;">
            ${isInactive
        ? "⚫ Desligado"
        : isBackupActive
          ? "🟡 Backup ativo"
          : "🟢 Ativo"
      }
          </div>
        </div>

        <div
          style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
          "
        >
          ${isInactive
        ? ""
        : isBackupActive
          ? `
                  <button
                    class="btn btn-secondary"
                    type="button"
                    id="portal-stop-collaborator-backup"
                    onclick="portalStopCollaboratorBackup('${collaborator.slackUserId}')"
                  >
                    ↩️ Encerrar backup
                  </button>
                `
          : `
                  <button
                    class="btn btn-secondary"
                    type="button"
                    id="portal-start-collaborator-backup"
                    onclick="portalStartCollaboratorBackup('${collaborator.slackUserId}')"
                  >
                    🛟 Iniciar backup
                  </button>
                `
      }

          ${!isInactive
        ? `
                <button
                  class="btn btn-danger"
                  type="button"
                  id="portal-deactivate-collaborator"
                  onclick="portalDeactivateCollaborator('${collaborator.slackUserId}')"
                >
                  🚫 Desligar colaborador
                </button>
              `
        : ""
      }
        </div>
      </div>
    `;

  return `

    ${collaboratorActions}

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

    <div class="dashboard-grid" style="margin-top:28px;">

      ${dashboardSection({
      title: "📅 Próximas tarefas",
      body: collaborator.tasks.length === 0
        ? `
              <p>
                Nenhuma tarefa pendente.
              </p>
            `
        : `
              <h3
                style="
                  margin-bottom:14px;
                  font-size:18px;
                "
              >
                Hoje
              </h3>

              ${todayTasks.length
          ? todayTasks.map(task =>
            upcomingTask({
              id: task.id,
              title: task.title,
              urgency: task.urgency,
              deadlineTime: task.deadlineTime,
              responsible: `Responsável: ${task.responsibleName}`,
            })
          ).join("")
          : `
                    <p>
                      Nenhuma tarefa para hoje.
                    </p>
                  `
        }

              ${accordion({
          id: "tomorrow-tasks",
          title: "Amanhã",
          count: tomorrowTasks.length,
          body: tomorrowTasks.length
            ? tomorrowTasks
              .map(task =>
                upcomingTask({
                  id: task.id,
                  title: task.title,
                  urgency: task.urgency,
                  deadlineTime: task.deadlineTime,
                  responsible: `Responsável: ${task.responsibleName}`,
                })
              )
              .join("")
            : `
        <p style="color:#6B7280;">
          Nenhuma tarefa para amanhã.
        </p>
      `,
        })}

              ${accordion({
          id: "future-tasks",
          title: "Futuras",
          count: futureTasks.length,
          body: futureTasks.length
            ? futureTasks
              .map(task =>
                upcomingTask({
                  id: task.id,
                  title: task.title,
                  urgency: task.urgency,
                  deadlineTime: task.deadlineTime,
                  responsible: `Responsável: ${task.responsibleName}`,
                })
              )
              .join("")
            : `
        <p style="color:#6B7280;">
          Nenhuma tarefa futura.
        </p>
      `,
        })}
            `,
    })}

      ${dashboardSection({
      title: "✅ Concluídas hoje",
      body: collaborator.completedToday.length
        ? collaborator.completedToday
          .map(task =>
            completedTask({
              id: task.id,
              title: task.title,
              urgency: task.urgency,
              completedAt: task.completedAt,
            })
          )
          .join("")
        : `
              <p>
                Nenhuma tarefa concluída hoje.
              </p>
            `,
    })}

    </div>


    <div
  class="card"
  style="margin-top:28px;"
>

  <h2 style="margin-bottom:20px;">
    🏷️ Temas
  </h2>

  ${collaborator.themes.length
      ? collaborator.themes
        .map(group =>
          accordion({
            id: `theme-${group.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`,
            title: group.name,
            count: group.tasks.length,
            body: group.tasks
              .map(task =>
                taskRow({
                  id: task.id,
                  title: task.title,
                  deadlineTime: task.deadlineTime,
                  urgency: task.urgency,
                })
              )
              .join(""),
          })
        )
        .join("")
      : `
        <p>
          Nenhuma tarefa encontrada por tema.
        </p>
      `
    }

</div>

    <div
      class="card"
      style="margin-top:28px;"
    >

      <h2 style="margin-bottom:20px;">
        🔁 Recorrências
      </h2>

      ${collaborator.recurrences
      .map(group =>
        accordion({
          id: `recurrence-${group.name}`,
          title: group.name,
          count: group.tasks.length,
          body: group.tasks
            .map(task =>
              taskRow({
                id: task.id,
                title: task.title,
                deadlineTime: task.deadlineTime,
                urgency: task.urgency,
              })
            )
            .join(""),
        })
      )
      .join("")
    }

    </div>

    <div
      class="card"
      style="margin-top:28px;"
    >

      <h2 style="margin-bottom:20px;">
        🔥 Prioridades
      </h2>

      ${collaborator.urgencies
      .map(group =>
        accordion({
          id: `urgency-${group.name}`,
          title: group.name,
          count: group.tasks.length,
          body: group.tasks
            .map(task =>
              taskRow({
                id: task.id,
                title: task.title,
                deadlineTime: task.deadlineTime,
                urgency: task.urgency,
              })
            )
            .join(""),
        })
      )
      .join("")
    }

    </div>

    <div
  class="card"
  style="margin-top:28px;"
>

  <h2 style="margin-bottom:20px;">
    📌 AOR
  </h2>

  ${onDemandTasks.length
      ? onDemandTasks
        .map(task =>
          taskRow({
            id: task.id,
            title: task.title,
            deadlineTime: task.deadlineTime,
          })
        )
        .join("")
      : `
        <p>
          Nenhuma tarefa AOR.
        </p>
      `
    }

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