type CompletedTaskProps = {
  id: string;
  title: string;
  urgency: "light" | "asap" | "turbo";
  completedAt: Date;
};

function urgencyBadge(
  urgency: CompletedTaskProps["urgency"]
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

export function completedTask(task: CompletedTaskProps) {

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

        ${urgencyBadge(task.urgency)}

      </div>

      <div
        style="
          font-weight:600;
          font-size:16px;
          margin-bottom:10px;
        "
      >
        ${task.title}
      </div>

      <div
        style="
          color:#6B7280;
          font-size:14px;
        "
      >
        🕒 ${new Date(task.completedAt).toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }
  )}
      </div>

    </div>
  `;

}