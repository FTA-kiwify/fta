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

type CreateTaskModalConfig = {
    mode?: "create" | "edit";

    task?: {
        id: string;
        title: string;
        description: string | null;
        processId: string | null;
        responsible: string;

        term: string | null;
        deadlineTime: string | null;

        recurrence: string | null;
        urgency: string;
        reminderMode: string;

        turboPreviousDay: boolean;
        turboStartTime: string | null;

        calendarPrivate: boolean;
        taskType: string;

        carbonCopies: string[];
    };
};

export function createTaskModal(
    options: PortalCreateTaskOptions,
    config: CreateTaskModalConfig = {}
) {

    const isEdit =
        config.mode === "edit" &&
        Boolean(config.task);

    const task =
        config.task ?? null;

    const responsibleInitial =
        task?.responsible
            ? options.collaborators.find(
                collaborator =>
                    collaborator.id === task.responsible
            )
            : null;

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
            ${isEdit ? "✏️ Editar tarefa" : "📝 Criar tarefa"}
          </h2>

          <p
            style="
              margin:6px 0 0;
              font-size:15px;
              color:#6B7280;
            "
          >
            ${isEdit
            ? "Edite as informações da atividade."
            : "Crie uma nova atividade no FTA."
        }
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
            value="${escapeHtml(task?.title)}"
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
>${escapeHtml(task?.description)}</textarea>

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
  ${task?.processId === process.id ? "selected" : ""}
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

          <div
            id="portal-responsible-picker"
            style="
              position:relative;
            "
          >

            <input
              id="portal-task-responsible-search"
              class="portal-input"
              type="text"
              placeholder="Pesquisar usuário..."
              autocomplete="off"
              onfocus="portalOpenResponsiblePicker()"
              oninput="portalFilterResponsible()"
              value="${escapeHtml(responsibleInitial?.name)}"
            />

            <input
              id="portal-task-responsible"
              type="hidden"
              value="${escapeHtml(responsibleInitial?.id)}"
            />

            <div
              id="portal-responsible-options"
              style="
                display:none;
                position:absolute;
                left:0;
                right:0;
                top:calc(100% + 6px);
                z-index:100;
                max-height:260px;
                overflow-y:auto;
                background:#FFFFFF;
                border:1px solid #E5E7EB;
                border-radius:12px;
                box-shadow:0 12px 30px rgba(15,23,42,.14);
                padding:6px;
              "
            >

              ${options.collaborators
            .map(collaborator => `
                  <button
                    type="button"
                    class="portal-responsible-option"
                    data-user-id="${escapeHtml(collaborator.id)}"
                    data-user-name="${escapeHtml(collaborator.name)}"
                    onclick="portalSelectResponsible(
                      '${escapeHtml(collaborator.id)}',
                      '${escapeHtml(collaborator.name)}'
                    )"
                    style="
                      width:100%;
                      border:none;
                      background:transparent;
                      text-align:left;
                      padding:10px 12px;
                      border-radius:8px;
                      cursor:pointer;
                      font-size:14px;
                      color:#1F2937;
                    "
                    onmouseover="this.style.background='#F3F4F6'"
                    onmouseout="this.style.background='transparent'"
                  >
                    ${escapeHtml(collaborator.name)}
                  </button>
                `)
            .join("")}

              <div
                id="portal-responsible-empty"
                style="
                  display:none;
                  padding:14px 12px;
                  color:#6B7280;
                  font-size:14px;
                "
              >
                Nenhum usuário encontrado.
              </div>

            </div>

          </div>

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

            <option
  value="normal"
  ${!task || task.taskType === "normal" ? "selected" : ""}
>

            <option
  value="on_demand"
  ${task?.taskType === "on_demand" ? "selected" : ""}
>
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
              value="${escapeHtml(task?.term)}"
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
              value="${escapeHtml(task?.deadlineTime)}"
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

              <option
  value="none"
  ${!task?.recurrence ? "selected" : ""}
>
  Sem recorrência
</option>

<option
  value="daily"
  ${task?.recurrence === "daily" ? "selected" : ""}
>
  Diária
</option>

<option
  value="weekly"
  ${task?.recurrence === "weekly" ? "selected" : ""}
>
  Semanal
</option>

<option
  value="biweekly"
  ${task?.recurrence === "biweekly" ? "selected" : ""}
>
  Quinzenal
</option>

<option
  value="monthly"
  ${task?.recurrence === "monthly" ? "selected" : ""}
>
  Mensal
</option>

<option
  value="quarterly"
  ${task?.recurrence === "quarterly" ? "selected" : ""}
>
  Trimestral
</option>

<option
  value="semiannual"
  ${task?.recurrence === "semiannual" ? "selected" : ""}
>
  Semestral
</option>

<option
  value="annual"
  ${task?.recurrence === "annual" ? "selected" : ""}
>
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

              <option
  value="light"
  ${!task || task.urgency === "light" ? "selected" : ""}
>
  🟢 Light
</option>

<option
  value="asap"
  ${task?.urgency === "asap" ? "selected" : ""}
>
  🟡 ASAP
</option>

<option
  value="turbo"
  ${task?.urgency === "turbo" ? "selected" : ""}
>
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
                    ${task?.turboPreviousDay ? "checked" : ""}

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
                  value="${escapeHtml(task?.turboStartTime)}"
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

              <option
  value="until"
  ${!task || task.reminderMode !== "from" ? "selected" : ""}
>
                ⏰ Entregar até o prazo
              </option>

              <option
  value="from"
  ${task?.reminderMode === "from" ? "selected" : ""}
>
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

          <div
            id="portal-cc-picker"
            style="
              position:relative;
            "
          >

            <div
              id="portal-cc-selected"
              style="
                display:flex;
                flex-wrap:wrap;
                gap:7px;
                margin-bottom:8px;
              "
            ></div>

            <input
              id="portal-task-carbon-copies-search"
              class="portal-input"
              type="text"
              placeholder="Pesquisar usuários..."
              autocomplete="off"
              onfocus="portalOpenCcPicker()"
              oninput="portalFilterCarbonCopies()"
            />

            <div
              id="portal-cc-options"
              style="
                display:none;
                position:absolute;
                left:0;
                right:0;
                top:calc(100% + 6px);
                z-index:100;
                max-height:260px;
                overflow-y:auto;
                background:#FFFFFF;
                border:1px solid #E5E7EB;
                border-radius:12px;
                box-shadow:0 12px 30px rgba(15,23,42,.14);
                padding:6px;
              "
            >

              ${options.collaborators
            .map(collaborator => `
                  <button
                    type="button"
                    class="portal-cc-option"
                    data-user-id="${escapeHtml(collaborator.id)}"
                    data-user-name="${escapeHtml(collaborator.name)}"
                    onclick="portalToggleCarbonCopy(
                      '${escapeHtml(collaborator.id)}',
                      '${escapeHtml(collaborator.name)}'
                    )"
                    style="
                      width:100%;
                      border:none;
                      background:transparent;
                      text-align:left;
                      padding:10px 12px;
                      border-radius:8px;
                      cursor:pointer;
                      font-size:14px;
                      color:#1F2937;
                    "
                    onmouseover="this.style.background='#F3F4F6'"
                    onmouseout="this.style.background='transparent'"
                  >
                    ${escapeHtml(collaborator.name)}
                  </button>
                `)
            .join("")}

              <div
                id="portal-cc-empty"
                style="
                  display:none;
                  padding:14px 12px;
                  color:#6B7280;
                  font-size:14px;
                "
              >
                Nenhum usuário encontrado.
              </div>

            </div>

            <select
              id="portal-task-carbon-copies"
              multiple
              style="display:none;"
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

          </div>

          <div
            style="
              margin-top:7px;
              color:#9CA3AF;
              font-size:12px;
            "
          >
            Pesquise e selecione quantas pessoas quiser.
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
  ${task?.calendarPrivate ? "checked" : ""}
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
  id="portal-create-task-button"
  type="button"
  class="btn-primary"
  onclick="${isEdit
            ? `portalUpdateTask('${escapeHtml(task?.id)}')`
            : "portalCreateTask()"
        }"
>
  ${isEdit ? "Salvar alterações" : "Criar"}
</button>

        </div>

      </form>

    </div>
  `;
}
