import type { TaskDetails } from "../../services/portal/taskDetailsService";

function urgencyBadge(
  urgency: TaskDetails["urgency"]
) {

  switch (urgency) {

    case "turbo":
      return `
        <span
          style="
            background:#FEE2E2;
            color:#DC2626;
            padding:4px 10px;
            border-radius:999px;
            font-size:13px;
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
            padding:4px 10px;
            border-radius:999px;
            font-size:13px;
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
            padding:4px 10px;
            border-radius:999px;
            font-size:13px;
            font-weight:600;
          "
        >
          🟢 Light
        </span>
      `;

  }

}

function formatDate(date: Date | null) {

  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");

}

function recurrenceLabel(
  recurrence: string | null
) {

  switch (recurrence) {

    case "daily":
      return "Diária";

    case "weekly":
      return "Semanal";

    case "biweekly":
      return "Quinzenal";

    case "monthly":
      return "Mensal";

    case "quarterly":
      return "Trimestral";

    case "semiannual":
      return "Semestral";

    case "annual":
      return "Anual";

    case "none":
      return "Sem recorrência";

    default:
      return "-";

  }

}
function auditAction(action: string) {

  switch (action) {

    case "TASK_CREATED":
      return "🆕 Tarefa criada";

    case "TASK_DONE":
      return "✅ Tarefa concluída";

    case "TASK_RESCHEDULED":
      return "📅 Prazo alterado";

    case "TASK_REOPENED":
      return "🔄 Tarefa reaberta";

    default:
      return action;

  }

}

function auditDate(date: Date) {

  return new Date(date).toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }
  );

}

function infoCard(
  title: string,
  value: string,
  onclick?: string

) {

  return `
    <div
  ${onclick ? `onclick="${onclick}"` : ""}
  style="
    background:#F9FAFB;
    border:1px solid #E5E7EB;
    border-radius:14px;
    padding:16px;
    ${onclick ? "cursor:pointer;transition:background .15s;" : ""}
  "
  ${onclick ? `
    onmouseover="this.style.background='#F3F4F6'"
    onmouseout="this.style.background='#F9FAFB'"
  ` : ""}
>

      <div
        style="
          color:#6B7280;
          font-size:13px;
          margin-bottom:6px;
        "
      >
        ${title}
      </div>

      <div
  style="
    font-weight:600;
    ${onclick ? "color:#2563EB;" : ""}
  "
>
  ${value}
</div>

    </div>
  `;

}

export function taskModal(task: TaskDetails) {

  return `

    <div style="padding:32px;">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          margin-bottom:30px;
          gap:18px;
        "
      >

        <div
          style="
            flex:1;
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:16px;
            "
          >

            <h2
              style="
                margin:0;
                font-size:28px;
                line-height:1.3;
              "
            >
              📌 ${task.title}
            </h2>

            ${urgencyBadge(task.urgency)}

          </div>

        </div>

        <button
          onclick="closePortalModal()"
          style="
            border:none;
            background:none;
            cursor:pointer;
            font-size:28px;
            color:#6B7280;
          "
        >
          ✕
        </button>

      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:16px;
        "
      >

        ${infoCard(
    "👤 Responsável",
    task.responsible
  )}

        ${infoCard(
    "👨‍💼 Delegado por",
    task.delegatedBy ?? "-"
  )}


  ${infoCard(
    "📘 Processo",
    task.notionProcessUrl
      ? "Abrir no Notion"
      : "-",
    task.notionProcessUrl
      ? `window.open('${task.notionProcessUrl}','_blank')`
      : undefined
  )}

        ${infoCard(
    "🔁 Recorrência",
    recurrenceLabel(task.recurrence)
  )}
  ${infoCard(
    "🔒 Privacidade",
    task.calendarPrivate ? "Privada" : "Pública"
  )}

        ${infoCard(
    "📅 Prazo",
    `${formatDate(task.deadline)}${task.deadlineTime ? ` às ${task.deadlineTime}` : ""}`
  )}

        ${infoCard(
    "📆 Prazo original",
    formatDate(task.originalDeadline)
  )}

      </div>

      <hr
        style="
          border:none;
          border-top:1px solid #E5E7EB;
          margin:30px 0;
        "
      >

      <div style="margin-bottom:30px;">

        <h3
          style="
            margin:0 0 14px;
          "
        >
          👥 Cópias
        </h3>

        ${task.copies.length

      ? `
                <ul
                  style="
                    margin:0;
                    padding-left:20px;
                    line-height:1.9;
                  "
                >

                  ${task.copies
        .map(name => `<li>${name}</li>`)
        .join("")}

                </ul>
              `

      : `
                <span
                  style="
                    color:#6B7280;
                  "
                >
                  Nenhuma
                </span>
              `

    }

      </div>

      <hr
        style="
          border:none;
          border-top:1px solid #E5E7EB;
          margin:30px 0;
        "
      >

      <div>

        <h3
          style="
            margin:0 0 14px;
          "
        >
          📝 Descrição
        </h3>

        <div
          style="
            white-space:pre-wrap;
            line-height:1.7;
            color:#374151;
          "
        >
          ${task.description ?? "Sem descrição."}
        </div>

      </div>

      <hr
  style="
    border:none;
    border-top:1px solid #E5E7EB;
    margin:30px 0;
  "
>

<div>

  <h3
    style="
      margin:0 0 18px;
    "
  >
    📜 Histórico
  </h3>

  ${task.auditLogs?.length

      ? task.auditLogs.map(log => `

        <div
          style="
            border-left:3px solid #E5E7EB;
            padding-left:14px;
            margin-bottom:18px;
          "
        >

          <div
            style="
              font-weight:600;
              margin-bottom:6px;
            "
          >
            ${auditAction(log.action)}
          </div>

          <div
            style="
              color:#6B7280;
              font-size:13px;
            "
          >
            ${auditDate(log.createdAt)}
          </div>

          <div
            style="
              color:#374151;
              margin-top:4px;
            "
          >
            ${log.actorName ?? "Sistema"}
          </div>

        </div>

      `).join("")

      : `
          <span
            style="
              color:#6B7280;
            "
          >
            Nenhum histórico encontrado.
          </span>
        `
    }

</div>
${task.taskType === "on_demand"
      ? `
      <hr
        style="
          border:none;
          border-top:1px solid #E5E7EB;
          margin:30px 0;
        "
      >

      <div
        style="
          display:flex;
          justify-content:flex-end;
        "
      >
        <button
          type="button"
          class="btn-primary"
          onclick="openPortalModal('/portal/tasks/${task.id}/create-from-template/modal')"
        >
          ▶ Criar atividade
        </button>
      </div>
    `
      : ""
    }
    </div>

  `;

}