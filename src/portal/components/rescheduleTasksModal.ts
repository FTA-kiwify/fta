export function rescheduleTasksModal() {

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
            📅 Reprogramar tarefas
          </h2>

          <p
            id="portal-reschedule-subtitle"
            style="
              margin:6px 0 0;
              font-size:15px;
              color:#6B7280;
            "
          >
            Defina o novo prazo das tarefas selecionadas.
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


      <div class="portal-form-group">

        <label class="portal-label">
          Nova data
        </label>

        <input
          id="portal-reschedule-date"
          class="portal-input"
          type="date"
        />

      </div>


      <div class="portal-form-group">

        <label class="portal-label">
          Novo horário
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
        />

      </div>


      <div
        style="
          padding:14px 16px;
          border-radius:12px;
          background:#F9FAFB;
          border:1px solid #E5E7EB;
          color:#6B7280;
          font-size:14px;
          line-height:1.5;
        "
      >
        A nova data e o novo horário serão aplicados
        a todas as tarefas selecionadas.
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