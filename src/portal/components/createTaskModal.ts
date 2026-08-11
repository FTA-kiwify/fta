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
    <div style="padding:32px;">

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          margin-bottom:28px;
        "
      >

        <div>
          <h2
            style="
              margin:0;
              font-size:24px;
              color:#111827;
            "
          >
            ➕ Criar tarefa
          </h2>

          <p
            style="
              margin:6px 0 0;
              color:#6B7280;
              font-size:14px;
            "
          >
            Preencha os dados da nova atividade.
          </p>
        </div>

        <button
          type="button"
          onclick="closePortalModal()"
          style="
            border:none;
            background:none;
            font-size:28px;
            line-height:1;
            cursor:pointer;
            color:#6B7280;
            padding:4px;
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

          <label class="portal-form-label">
            Título
          </label>

          <input
            id="portal-task-title"
            class="portal-form-input"
            type="text"
            placeholder="Ex.: Atualizar ALM"
            required
          />

        </div>


        <!-- DESCRIÇÃO -->

        <div class="portal-form-group">

          <label class="portal-form-label">
            Descrição
          </label>

          <textarea
            id="portal-task-description"
            class="portal-form-input"
            rows="4"
            placeholder="Descreva a atividade..."
            style="
              resize:vertical;
              min-height:100px;
            "
          ></textarea>

        </div>


        <!-- PROCESSO -->

        <div class="portal-form-group">

          <label class="portal-form-label">
            Processo
          </label>

          <select
            id="portal-task-process"
            class="portal-form-input"
          >

            <option value="">
              Nenhum processo
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

          <label class="portal-form-label">
            Responsável
          </label>

          <select
            id="portal-task-responsible"
            class="portal-form-input"
            required
          >

            <option value="">
              Selecione o responsável
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


        <!-- TIPO DA TAREFA -->

        <div class="portal-form-group">

          <label class="portal-form-label">
            Tipo da tarefa
          </label>

          <select
            id="portal-task-type"
            class="portal-form-input"
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


        <!-- CAMPOS DE TAREFA NORMAL -->

        <div id="portal-normal-task-fields">


          <!-- PRAZO -->

          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(2,minmax(0,1fr));
              gap:16px;
            "
          >

            <div class="portal-form-group">

              <label class="portal-form-label">
                Prazo
              </label>

              <input
                id="portal-task-term"
                class="portal-form-input"
                type="date"
              />

            </div>


            <!-- HORÁRIO -->

            <div class="portal-form-group">

              <label class="portal-form-label">
                Horário
              </label>

              <input
                id="portal-task-deadline-time"
                class="portal-form-input"
                type="time"
              />

            </div>

          </div>


          <!-- DEPENDE DE -->

          <div class="portal-form-group">

            <label class="portal-form-label">
              Depende de
            </label>

            <select
              id="portal-task-depends-on"
              class="portal-form-input"
            >

              <option value="">
                Nenhuma dependência
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

            <label class="portal-form-label">
              Recorrência
            </label>

            <select
              id="portal-task-recurrence"
              class="portal-form-input"
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

            <label class="portal-form-label">
              Prioridade
            </label>

            <select
              id="portal-task-urgency"
              class="portal-form-input"
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
                background:#FEF2F2;
                border:1px solid #FECACA;
                border-radius:12px;
                padding:16px;
                margin-bottom:20px;
              "
            >

              <div
                style="
                  font-weight:600;
                  color:#991B1B;
                  margin-bottom:14px;
                "
              >
                🔴 Configurações Turbo
              </div>


              <label
                style="
                  display:flex;
                  align-items:center;
                  gap:10px;
                  margin-bottom:16px;
                  cursor:pointer;
                "
              >

                <input
                  id="portal-task-turbo-previous-day"
                  type="checkbox"
                />

                <span>
                  Iniciar lembretes no dia anterior
                </span>

              </label>


              <div class="portal-form-group">

                <label class="portal-form-label">
                  Horário inicial dos lembretes
                </label>

                <input
                  id="portal-task-turbo-start-time"
                  class="portal-form-input"
                  type="time"
                />

              </div>

            </div>

          </div>


          <!-- MODO DE LEMBRETE -->

          <div class="portal-form-group">

            <label class="portal-form-label">
              Regra do prazo
            </label>

            <select
              id="portal-task-reminder-mode"
              class="portal-form-input"
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


        <!-- PESSOAS EM CÓPIA -->

        <div class="portal-form-group">

          <label class="portal-form-label">
            Pessoas em cópia
          </label>

          <select
            id="portal-task-carbon-copies"
            class="portal-form-input"
            multiple
            style="min-height:110px;"
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
              margin-top:6px;
              font-size:12px;
              color:#9CA3AF;
            "
          >
            Use Ctrl/Cmd para selecionar mais de uma pessoa.
          </div>

        </div>


        <!-- CALENDÁRIO PRIVADO -->

        <div
          style="
            padding:16px;
            background:#F9FAFB;
            border:1px solid #E5E7EB;
            border-radius:12px;
            margin-top:8px;
          "
        >

          <label
            style="
              display:flex;
              align-items:flex-start;
              gap:10px;
              cursor:pointer;
            "
          >

            <input
              id="portal-task-calendar-private"
              type="checkbox"
              style="margin-top:3px;"
            />

            <div>

              <div
                style="
                  font-weight:600;
                  color:#374151;
                "
              >
                🔒 Evento privado no calendário
              </div>

              <div
                style="
                  margin-top:3px;
                  font-size:13px;
                  color:#6B7280;
                "
              >
                O evento será criado como privado no Google Calendar.
              </div>

            </div>

          </label>

        </div>


        <!-- AÇÕES -->

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:12px;
            margin-top:30px;
            padding-top:22px;
            border-top:1px solid #E5E7EB;
          "
        >

          <button
            type="button"
            onclick="closePortalModal()"
            style="
              border:1px solid #D1D5DB;
              background:#FFFFFF;
              color:#374151;
              padding:11px 18px;
              border-radius:10px;
              cursor:pointer;
              font-weight:600;
            "
          >
            Cancelar
          </button>

          <button
            id="portal-create-task-submit"
            type="button"
            disabled
            title="A criação será conectada à lógica existente na próxima etapa."
            style="
              border:none;
              background:#9CA3AF;
              color:#FFFFFF;
              padding:11px 20px;
              border-radius:10px;
              cursor:not-allowed;
              font-weight:600;
            "
          >
            Criar tarefa
          </button>

        </div>

      </form>

    </div>
  `;
}
