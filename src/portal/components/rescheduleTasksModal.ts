type RescheduleTasksModalArgs = {
  id: string;
  title: string;
  deadline: Date | null;
  deadlineTime: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateInput(
  date: Date | null
) {

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}

export function rescheduleTasksModal(
  args: RescheduleTasksModalArgs
) {

  const deadline =
    formatDateInput(args.deadline);

  const deadlineTime =
    args.deadlineTime?.trim() ?? "";

  const title =
    escapeHtml(args.title);

  return `
    <div
      style="
        width:520px;
        max-width:100%;
        padding:32px;
      "
    >

      <div class="portal-modal-header">

        <div>

          <h2
            style="
              margin:0;
              font-size:26px;
            "
          >
            📅 Reprogramar tarefa
          </h2>

          <p
            style="
              margin:6px 0 0;
              font-size:15px;
              color:#6B7280;
            "
          >
            Altere a data ou o horário do prazo.
          </p>

        </div>

        <button
          type="button"
          onclick="closePortalModal()"
          style="
            border:none;
            background:none;
            font-size:28px;
            cursor:pointer;
            color:#6B7280;
          "
        >
          ✕
        </button>

      </div>


      <div
        style="
          margin-bottom:24px;
          padding:14px 16px;
          border:1px solid #E5E7EB;
          border-radius:12px;
          background:#F9FAFB;
        "
      >

        <div
          style="
            font-size:12px;
            font-weight:600;
            color:#6B7280;
            margin-bottom:5px;
            text-transform:uppercase;
            letter-spacing:.04em;
          "
        >
          Tarefa
        </div>

        <div
          style="
            font-size:15px;
            font-weight:600;
            color:#111827;
          "
        >
          ${title}
        </div>

      </div>


      <input
        id="portal-reschedule-task-id"
        type="hidden"
        value="${escapeHtml(args.id)}"
      />


      <div class="portal-form-group">

        <label class="portal-label">
          Data
        </label>

        <input
          id="portal-reschedule-date"
          class="portal-input"
          type="date"
          value="${deadline}"
        />

      </div>


      <div class="portal-form-group">

        <label class="portal-label">
          Horário
          <span
            style="
              font-weight:400;
              color:#6B7280;
            "
          >
            (opcional)
          </span>
        </label>

        <input
          id="portal-reschedule-time"
          class="portal-input"
          type="time"
          value="${escapeHtml(deadlineTime)}"
        />

      </div>


      <div
        class="portal-modal-footer"
        style="
          padding-top:22px;
          border-top:1px solid #E5E7EB;
        "
      >

        <button
          type="button"
          class="btn-secondary"
          onclick="closePortalModal()"
        >
          Cancelar
        </button>

        <button
          id="portal-reschedule-submit"
          type="button"
          class="btn-primary"
          onclick="portalConfirmRescheduleTasks()"
        >
          📅 Reprogramar
        </button>

      </div>

    </div>
  `;
}
