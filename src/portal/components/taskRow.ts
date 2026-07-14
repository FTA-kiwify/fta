export type TaskRow = {
  id: string;
  title: string;
  subtitle: string;
  urgency: "light" | "asap" | "turbo";
  deadlineTime?: string | null;
  rightText?: string;
};

function urgencyBadge(urgency: TaskRow["urgency"]) {
  switch (urgency) {
    case "turbo":
      return `
        <span
          style="
            background:#FEE2E2;
            color:#DC2626;
            padding:2px 8px;
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
            padding:2px 8px;
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
            color:#15803D;
            padding:2px 8px;
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

export function taskRow(task: TaskRow) {
  return `
    <div
      onclick="openPortalModal('/portal/tasks/${task.id}/modal')"
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

      <div>

        <div
          style="
            font-weight:600;
            margin-bottom:8px;
          "
        >
          ${task.title}
        </div>

        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:10px;
            align-items:center;
            color:#6B7280;
            font-size:14px;
          "
        >

          <span>
            ${task.subtitle}
          </span>

          ${
            task.deadlineTime
              ? `<span>🕒 ${task.deadlineTime}</span>`
              : ""
          }

          ${urgencyBadge(task.urgency)}

        </div>

      </div>

      ${
        task.rightText
          ? `
            <div
              style="
                color:#6B7280;
                font-size:14px;
              "
            >
              ${task.rightText}
            </div>
          `
          : ""
      }

    </div>
  `;
}