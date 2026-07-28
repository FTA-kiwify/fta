type UpcomingTaskProps = {
  id: string;
  title: string;
  responsible: string;
  urgency?: "light" | "asap" | "turbo";
  deadlineTime?: string | null;
  hideResponsible?: boolean;
};

function urgencyBadge(
  urgency: UpcomingTaskProps["urgency"]
) {

  switch (urgency) {

    case "turbo":
      return `
        <span
          style="
            background:#FEE2E2;
            color:#DC2626;
            padding:3px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
          "
        >
          🔴 Turbo
        </span>
      `;

    case "asap":
      return `
        <span
          style="
            background:#FEF3C7;
            color:#D97706;
            padding:3px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
          "
        >
          🟡 ASAP
        </span>
      `;

    default:
      return `
        <span
          style="
            background:#DCFCE7;
            color:#16A34A;
            padding:3px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
          "
        >
          🟢 Light
        </span>
      `;

  }

}

export function upcomingTask(task: UpcomingTaskProps) {

  return `
    <div
      onclick="openPortalModal('/portal/tasks/${task.id}/modal')"
      style="
        padding:20px 0;
        border-bottom:1px solid #E5E7EB;
        cursor:pointer;
        transition:background .15s;
      "
      onmouseover="this.style.background='#F9FAFB'"
      onmouseout="this.style.background='transparent'"
    >

      <div style="margin-bottom:10px;">

        ${task.urgency
      ? urgencyBadge(task.urgency)
      : ""
    }

      </div>

      <div
        style="
          font-weight:600;
          font-size:16px;
          margin-bottom:${task.hideResponsible ? "6px" : "10px"};
        "
      >
        ${task.title}
      </div>

      ${task.hideResponsible

      ? (
        task.deadlineTime
          ? `
                  <div
                    style="
                      color:#6B7280;
                      font-size:14px;
                    "
                  >
                    🕒 ${task.deadlineTime}
                  </div>
                `
          : ""
      )

      : `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  color:#6B7280;
                  font-size:14px;
                "
              >

                <span>
                  👤 ${task.responsible}
                </span>

                ${task.deadlineTime
        ? `
                      <span>
                        🕒 ${task.deadlineTime}
                      </span>
                    `
        : ""
      }

              </div>
            `
    }

    </div>
  `;

}