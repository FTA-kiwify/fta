import type {
  PortalCreateTaskOptions,
} from "../../services/portal/createTaskOptionsService";

function escapeHtml(
  value: string | null | undefined
) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createTaskModal(
  options: PortalCreateTaskOptions
) {

  return `
    <div
      style="
        width:720px;
        max-width:100%;
        padding:32px;
      "
    >

      <!-- HEADER -->

      <div class="portal-modal-header">

        <div>

          <h2
            style="
              margin:0;
              font-size:28px;
            "
          >
            📝 Criar tarefa
          </h2>

          <p
            style="
              margin:6px 0 0;
              font-size:15px;
              color:#6B7280;
            "
          >
            Crie uma nova atividade no FTA.
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


      <form
        id="portal-create-task-form"
        onsubmit="return false;"
      >

        <!-- TÍTULO -->

        <div class="portal-form-group">

          <label class="portal-label">
            Título
          </label>

          <input
            id="portal-task-title"
            class="portal-input"
            type="text"
            placeholder="Escreva algo"
            autocomplete="off"
          />

        </div>


        <!-- DESCRIÇÃO -->

        <div class="portal-form-group">

          <label class="portal-label">
            Descrição
            <span
              style="
                font-weight:400;
                color:#6B7280;
              "
            >
              (opcional)
            </span>
          </label>

          <textarea
            id="portal-task-description"
            class="portal-textarea"
            placeholder="Escreva algo"
          ></textarea>

        </div>


        <!-- PROCESSO -->

        <div class="portal-form-group">

          <label class="portal-label">
            Processo
            <span
              style="
                font-weight:400;
                color:#6B7280;
              "
            >
              (opcional)
            </span>
          </label>

          <select
            id="portal-task-process"
            class="portal-select"
          >

            <option value="">
              Selecione um processo
            </option>

            ${options.processes
              .map(process => `
                <option
                  value="${escapeHtml(process.id)}"
                >
                  ${escapeHtml(process.name)}
                </option>
              `)
              .join("")}

          </select>

        </div>


        <!-- RESPONSÁVEL -->

        <div class="portal-form-group">

          <label class="portal-label">
            Responsável
          </label>

          <select
            id="portal-task-responsible"
            class="portal-select"
          >

            <option value="">
              Selecione um usuário
            </option>

            ${options.collaborators
              .map(collaborator => `
                <option
                  value="${escapeHtml(collaborator.id)}"
                >
                  ${escapeHtml(collaborator.name)}
                </option>
              `)
              .join("")}

          </select>

        </div>


        <!-- TIPO -->

        <div class="portal-form-group">

          <label class="portal-label">
            Tipo da tarefa
          </label>

          <select
            id="portal-task-type"
            class="portal-select"
            onchange="portalHandleTaskTypeChange()"
          >

            <option value="normal">
              📅 Normal
            </option>

            <option value="on_demand">
              ⚡ Sob demanda
            </option>

          </select>

        </div>


        <!-- CAMPOS DA TAREFA NORMAL -->

        <div id="portal-normal-task-fields">


          <!-- PRAZO -->

          <div class="portal-form-group">

            <label class="portal-label">
              Prazo (data)
            </label>

            <input
              id="portal-task-term"
              class="portal-input"
              type="date"
            />

          </div>


          <!-- HORÁRIO -->

          <div class="portal-form-group">

            <label class="portal-label">
              Horário do prazo
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
              id="portal-task-deadline-time"
              class="portal-input"
              type="time"
            />

          </div>


          <!-- DEPENDÊNCIA -->

          <div class="portal-form-group">

            <label class="portal-label">
              Depende de
              <span
                style="
                  font-weight:400;
                  color:#6B7280;
                "
              >
                (opcional)
              </span>
            </label>

            <select
              id="portal-task-depends-on"
              class="portal-select"
            >

              <option value="">
                Selecione a tarefa principal
              </option>

              ${options.dependencies
                .map(task => `
                  <option
                    value="${escapeHtml(task.id)}"
                  >
                    ${escapeHtml(task.name)}
                  </option>
                `)
                .join("")}

            </select>

          </div>


          <!-- RECORRÊNCIA -->

          <div class="portal-form-group">

            <label class="portal-label">
              Recorrência
              <span
                style="
                  font-weight:400;
                  color:#6B7280;
                "
              >
                (opcional)
              </span>
            </label>

            <select
              id="portal-task-recurrence"
              class="portal-select"
            >

              <option value="none">
                Sem recorrência
              </option>

              <option value="daily">
                Diária
              </option>

              <option value="weekly">
                Semanal
              </option>

              <option value="biweekly">
                Quinzenal
              </option>

              <option value="monthly">
                Mensal
              </option>

              <option value="quarterly">
                Trimestral
              </option>

              <option value="semiannual">
                Semestral
              </option>

              <option value="annual">
                Anual
              </option>

            </select>

          </div>


          <!-- URGÊNCIA -->

          <div class="portal-form-group">

            <label class="portal-label">
              Nível de urgência
            </label>

            <select
              id="portal-task-urgency"
              class="portal-select"
              onchange="portalHandleUrgencyChange()"
            >

              <option value="light">
                🟢 Light
              </option>

              <option value="asap">
                🟡 ASAP
              </option>

              <option value="turbo">
                🔴 Turbo
              </option>

            </select>

          </div>


          <!-- TURBO -->

          <div
            id="portal-turbo-fields"
            style="display:none;"
          >

            <div
              style="
                border:1px solid #FECACA;
                background:#FEF2F2;
                border-radius:12px;
                padding:18px;
                margin-bottom:22px;
              "
            >

              <div
                style="
                  font-weight:700;
                  color:#991B1B;
                  margin-bottom:16px;
                "
              >
                🔴 Configurações Turbo
              </div>


              <div
                style="
                  margin-bottom:18px;
                "
              >

                <label
                  style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    cursor:pointer;
                    font-size:14px;
                    color:#374151;
                  "
                >

                  <input
                    id="portal-task-turbo-previous-day"
                    type="checkbox"
                  />

                  Iniciar lembretes no dia anterior

                </label>

              </div>


              <div>

                <label class="portal-label">
                  Horário inicial dos lembretes
                </label>

                <input
                  id="portal-task-turbo-start-time"
                  class="portal-input"
                  type="time"
                />

              </div>

            </div>

          </div>


          <!-- FOLLOW-UP -->

          <div class="portal-form-group">

            <label class="portal-label">
              Tipo de follow-up
            </label>

            <select
              id="portal-task-reminder-mode"
              class="portal-select"
            >

              <option value="until">
                ⏰ Entregar até o prazo
              </option>

              <option value="from">
                ▶️ Entregar a partir do prazo
              </option>

            </select>

          </div>

        </div>


        <!-- CC -->

        <div class="portal-form-group">

          <label class="portal-label">
            Pessoas em cópia
            <span
              style="
                font-weight:400;
                color:#6B7280;
              "
            >
              (opcional)
            </span>
          </label>

          <select
            id="portal-task-carbon-copies"
            class="portal-select"
            multiple
            style="
              min-height:130px;
            "
          >

            ${options.collaborators
              .map(collaborator => `
                <option
                  value="${escapeHtml(collaborator.id)}"
                >
                  ${escapeHtml(collaborator.name)}
                </option>
              `)
              .join("")}

          </select>

          <div
            style="
              margin-top:7px;
              color:#9CA3AF;
              font-size:12px;
            "
          >
            Use Ctrl/Cmd para selecionar mais de uma pessoa.
          </div>

        </div>


        <!-- PRIVACIDADE -->

        <div class="portal-form-group">

          <label class="portal-label">
            Privacidade
            <span
              style="
                font-weight:400;
                color:#6B7280;
              "
            >
              (opcional)
            </span>
          </label>

          <div
            style="
              border:1px solid #E5E7EB;
              border-radius:12px;
              padding:16px;
              background:#F9FAFB;
            "
          >

            <label
              style="
                display:flex;
                align-items:center;
                gap:10px;
                cursor:pointer;
                font-size:14px;
                color:#374151;
              "
            >

              <input
                id="portal-task-calendar-private"
                type="checkbox"
              />

              🔒 Atividade privada

            </label>

          </div>

        </div>


        <!-- FOOTER -->

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
            id="portal-create-task-submit"
            type="button"
            class="btn-primary"
            disabled
            style="
              opacity:.55;
              cursor:not-allowed;
            "
          >
            Criar
          </button>

        </div>

      </form>

    </div>
  `;
}
