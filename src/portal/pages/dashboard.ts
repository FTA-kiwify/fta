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
    <div class="card">

      <h1>

  ${greeting}, ${data.userName} ${greeting === "Bom dia"
      ? "☀️"
      : greeting === "Boa tarde"
        ? "👋"
        : "🌙"
    }

</h1>

<p>
  Acompanhe suas prioridades de hoje.
</p>

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
                responsible: task.responsibleName,
                urgency: task.urgency,
                deadlineTime: task.deadlineTime,
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
              id: "dashboard-tomorrow",
              title: "Amanhã",
              count: tomorrowTasks.length,
              body: tomorrowTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: task.responsibleName,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
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
              id: "dashboard-future",
              title: "Futuras",
              count: futureTasks.length,
              body: futureTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: task.responsibleName,
                    urgency: task.urgency,
                    deadlineTime: task.deadlineTime,
                  })
                )
                .join(""),
            })
            : ""
          }

${onDemandTasks.length
            ? accordion({
              id: "dashboard-on-demand",
              title: "Sob demanda",
              count: onDemandTasks.length,
              body: onDemandTasks
                .map(task =>
                  upcomingTask({
                    id: task.id,
                    title: task.title,
                    responsible: task.responsibleName,
                    deadlineTime: task.deadlineTime,
                  })
                )
                .join(""),
            })
            : ""
          }

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