import { statCard } from "../components/statCard";
import { dashboardSection } from "../components/dashboardSection";
import type { DelegatedDashboardData } from "../../services/portal/delegatedDashboardService";
import { upcomingTask } from "../components/upcomingTask";
import { completedTask } from "../components/completedTask";
import { accordion } from "../components/accordion";
import {
  getBrazilToday,
  getGreeting,
} from "../../utils/date";

export function delegatedDashboardPage(data: DelegatedDashboardData) {

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
  Acompanhe as tarefas que você delegou para outras pessoas.
</p>

      </div>

      <button
        type="button"
        onclick="openPortalModal('/portal/tasks/create/modal', '760px')"
        style="
          border:none;
          background:#25835D;
          color:#FFFFFF;
          padding:12px 18px;
          border-radius:10px;
          font-size:14px;
          font-weight:600;
          cursor:pointer;
          white-space:nowrap;
          display:flex;
          align-items:center;
          gap:8px;
          box-shadow:0 2px 6px rgba(15,23,42,.08);
          transition:
            transform .15s ease,
            box-shadow .15s ease,
            background .15s ease;
        "
        onmouseover="
          this.style.transform='translateY(-1px)';
          this.style.boxShadow='0 4px 10px rgba(15,23,42,.12)';
          this.style.background='#1F7553';
        "
        onmouseout="
          this.style.transform='translateY(0)';
          this.style.boxShadow='0 2px 6px rgba(15,23,42,.08)';
          this.style.background='#25835D';
        "
      >
        <span style="font-size:18px; line-height:1;">＋</span>
        Criar tarefa
      </button>

    </div>

    <div class="dashboard-grid">

      ${statCard({
      title: "Tarefas delegadas",
      value: data.pendingTasks,
      subtitle: "Pendentes",
      icon: "📋",

    })}

      ${statCard({
      title: "Vencem hoje",
      value: data.todayTasks,
      subtitle: "Para hoje",
      icon: "📅",
      color: "#F59E0B",
    })}

      ${statCard({
      title: "Turbo",
      value: data.turboTasks,
      subtitle: "Prioridade máxima",
      icon: "🔥",
      color: "#B91C1C",
    })}

      ${statCard({
      title: "Concluídas hoje",
      value: data.completedTodayTasks,
      subtitle: "Finalizadas hoje",
      icon: "✅",
      color: "#22C55E",
    })}

    </div>

    <div class="dashboard-grid">

      ${dashboardSection({

      title: "📅 Próximos vencimentos",

      body:

        data.upcomingTasks.length === 0

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
                responsible: `Responsável: ${task.responsibleName}`,
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

                ${tomorrowTasks.length
            ? `
      <div style="margin-top:16px;">
        ${accordion({
              id: "delegated-tomorrow",
              title: "Amanhã",
              count: tomorrowTasks.length,
              body: tomorrowTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: `Responsável: ${task.responsibleName}`,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
                    selectable: true,
                  })
                )
                .join(""),
            })}
      </div>
    `
            : ""
          }

                ${futureTasks.length
            ? accordion({
              id: "delegated-future",
              title: "Futuras",
              count: futureTasks.length,
              body: futureTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: `Responsável: ${task.responsibleName}`,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
                    selectable: true,
                  })
                )
                .join(""),
            })
            : ""
          }

${onDemandTasks.length
            ? accordion({
              id: "delegated-on-demand",
              title: "Sob demanda",
              count: onDemandTasks.length,
              body: onDemandTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: `Responsável: ${task.responsibleName}`,
                    deadlineTime: task.deadlineTime,
                    selectable: true,
                  })
                )
                .join(""),
            })
            : ""
          }
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

  `;

}