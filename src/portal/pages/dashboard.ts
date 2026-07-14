import { statCard } from "../components/statCard";
import { dashboardSection } from "../components/dashboardSection";
import type { DashboardData } from "../../services/portal/dashboardService";
import { upcomingTask } from "../components/upcomingTask";
import { completedTask } from "../components/completedTask";

function formatDay(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const taskDay = new Date(date);
  taskDay.setHours(0, 0, 0, 0);

  if (taskDay.getTime() === today.getTime()) {
    return "Hoje";
  }

  if (taskDay.getTime() === tomorrow.getTime()) {
    return "Amanhã";
  }

  return taskDay.toLocaleDateString("pt-BR");
}

export function dashboardPage(data: DashboardData) {
  return `
    <div class="card">

      <h1>Bem-vinda 👋</h1>

      <p>
        Minha rotina.
      </p>

    </div>

    <div class="dashboard-grid">

      ${statCard({
    title: "Minhas tarefas",
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

    body: (() => {
      if (data.upcomingTasks.length === 0) {
        return `
              <p>
                Nenhuma tarefa pendente.
              </p>
            `;
      }

      const groups = new Map<
        string,
        typeof data.upcomingTasks
      >();

      for (const task of data.upcomingTasks) {
        const key = formatDay(task.term);

        if (!groups.has(key)) {
          groups.set(key, []);
        }

        groups.get(key)!.push(task);
      }

      return [...groups.entries()]
        .map(([day, tasks]) => `
              <div style="margin-bottom:24px;">

                <h3
                  style="
                    margin-bottom:14px;
                    font-size:18px;
                  "
                >
                  ${day}
                </h3>

                ${tasks
            .map(task =>
              upcomingTask({
                id: task.id,
                title: task.title,
                responsible: task.responsibleName,
                urgency: task.urgency,
                deadlineTime: task.deadlineTime,
              })
            )
            .join("")}

              </div>
            `)
        .join("");
    })(),
  })}

      ${dashboardSection({
    title: "✅ Concluídas hoje",

    body: data.completedToday.length
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