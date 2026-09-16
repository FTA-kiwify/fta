import { statCard } from "../components/statCard";
import { dashboardSection } from "../components/dashboardSection";
import type { DashboardData } from "../../services/portal/dashboardService";
import { upcomingTask } from "../components/upcomingTask";
import { completedTask } from "../components/completedTask";
import { accordion } from "../components/accordion";
import {
  getBrazilToday,
  getGreeting,
} from "../../utils/date";

export function dashboardPage(data: DashboardData) {

  const today = getBrazilToday();
  const greeting = getGreeting();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const todayTasks = data.upcomingTasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    const d = new Date(task.term!);
    return d >= today && d < tomorrow;
  });

  const tomorrowTasks = data.upcomingTasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    const d = new Date(task.term!);
    return d >= tomorrow && d < dayAfter;
  });

  const futureTasks = data.upcomingTasks.filter(task => {
    if (task.taskType === "on_demand") return false;

    const d = new Date(task.term!);
    return d >= dayAfter;
  });
  const onDemandTasks = data.upcomingTasks.filter(
    task => task.taskType === "on_demand"
  );

  return `
        <div
      class="card"
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:24px;
      "
    >

      <div>

        <h1 style="margin-bottom:8px;">
          ${greeting}, ${data.userName} ${greeting === "Bom dia"
      ? "☀️"
      : greeting === "Boa tarde"
        ? "👋"
        : "🌙"
    }
        </h1>

        <p style="margin:0;">
          Acompanhe suas prioridades de hoje.
        </p>

      </div>

      <div
  style="
    display:flex;
    gap:10px;
    align-items:center;
  "
>

    <button
    type="button"
    class="portal-action-btn portal-action-primary"
    onclick="openPortalModal('/portal/tasks/create/modal', '760px')"
  >
    <span style="font-size:18px; line-height:1;">＋</span>
    Criar tarefa
  </button>

  <button
    type="button"
    class="portal-action-btn portal-action-outline"
    onclick="openPortalModal('/portal/tasks/create-aor/modal', '760px')"
  >
    <span style="font-size:16px; line-height:1;">⚡</span>
    Criar AOR
  </button>

</div>

</div>


<div class="dashboard-grid">

      ${statCard({
      title: "Minhas tarefas",
      value: data.pendingTasks,
      subtitle: "Pendentes",
      icon: "📋",
      onclick: "openPortalModal('/portal/dashboard/tasks/pending/modal')",

    })}

      ${statCard({
      title: "Vencem hoje",
      value: data.todayTasks,
      subtitle: "Para hoje",
      icon: "📅",
      color: "#F59E0B",
      onclick: "openPortalModal('/portal/dashboard/tasks/today/modal')"
    })}

      ${statCard({
      title: "Turbo",
      value: data.turboTasks,
      subtitle: "Prioridade máxima",
      icon: "🔥",
      color: "#B91C1C",
      onclick: "openPortalModal('/portal/dashboard/tasks/turbo/modal')"
    })}

      ${statCard({
      title: "Concluídas hoje",
      value: data.completedTodayTasks,
      subtitle: "Finalizadas hoje",
      icon: "✅",
      color: "#22C55E",
      onclick: "openPortalModal('/portal/dashboard/tasks/completed/modal')"
    })}

    </div>

    <div class="dashboard-grid">

      ${dashboardSection({

      title: "📅 Próximos vencimentos",

      body:

        todayTasks.length === 0 &&
          tomorrowTasks.length === 0 &&
          futureTasks.length === 0

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
                responsible:
                  task.delegatedByName === "Você"
                    ? "Criada por você"
                    : `Delegada por ${task.delegatedByName}`,
                urgency: task.urgency,
                deadlineTime: task.deadlineTime,
                selectable: true,
              })
            ).join("")
            : `
                        <p>
                          Nenhuma tarefa para hoje.
                        </p>
                      `
          }

                <div style="margin-top:16px;">
  ${accordion({
            id: "dashboard-tomorrow",
            title: "Amanhã",
            count: tomorrowTasks.length,
            body: tomorrowTasks.length
              ? tomorrowTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible:
                      task.delegatedByName === "Você"
                        ? "Criada por você"
                        : `Delegada por ${task.delegatedByName}`,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
                    selectable: true,
                  })
                )
                .join("")
              : `
          <p style="color:#6B7280;">
            Nenhuma tarefa para amanhã.
          </p>
        `,
          })}
</div>

                ${accordion({
            id: "dashboard-future",
            title: "Futuras",
            count: futureTasks.length,
            body: futureTasks.length
              ? futureTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible:
                      task.delegatedByName === "Você"
                        ? "Criada por você"
                        : `Delegada por ${task.delegatedByName}`,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
                    selectable: true,
                  })
                )
                .join("")
              : `
        <p style="color:#6B7280;">
          Nenhuma tarefa futura.
        </p>
      `,
          })}

          <div
  <div
  style="
    margin-top:18px;
    padding-top:18px;
    border-top:1px solid #E5E7EB;
    display:flex;
    justify-content:flex-end;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
  "
>
  <button
  id="portal-edit-selected-button"
  type="button"
  class="btn-secondary"
  disabled
  onclick="portalOpenEditSelected()"
  style="
    opacity:.5;
    cursor:not-allowed;
    min-width:150px;
  "
>
  ✏️ Editar
</button>

  <button
    id="portal-reschedule-selected-button"
    type="button"
    class="btn-secondary"
    disabled
    onclick="portalOpenRescheduleSelected()"
    style="
      opacity:.5;
      cursor:not-allowed;
      min-width:210px;
    "
  >
  
    📅 Reprogramar selecionadas
  </button>

  <button
    id="portal-complete-selected-button"
    type="button"
    class="btn-primary"
    disabled
    onclick="portalCompleteSelectedTasks()"
    style="
      opacity:.5;
      cursor:not-allowed;
      min-width:190px;
    "
  >
    ✓ Concluir selecionadas
  </button>

</div>

              `,

    })}

    

      ${dashboardSection({

      title: "✅ Concluídas hoje",

      body:

        data.completedToday.length

          ? data.completedToday
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
    📌 AOR
  </h2>

  ${onDemandTasks.length
      ? onDemandTasks
        .map(task =>
          upcomingTask({
            id: task.id,
            title: task.title,
            responsible:
              task.delegatedByName === "Você"
                ? "Criada por você"
                : `Delegada por ${task.delegatedByName}`,
            deadlineTime: task.deadlineTime,
            selectable: true,
          })
        )
        .join("")
      : `
        <p>
          Nenhuma AOR.
        </p>
      `
    }

</div>


  `;

}