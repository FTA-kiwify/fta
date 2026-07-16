export function teamCreateModal(
  departments: {
    id: string;
    name: string;
  }[]
) {

  return `

    <div
      style="
        width:600px;
        max-width:100%;
        padding:32px;
      "
    >

      <div class="portal-modal-header">

        <div>

          <h2
            style="
              margin:0;
              font-size:28px;
            "
          >
            🏢 Novo Time
          </h2>

          <p
            style="
              margin-top:6px;
              font-size:15px;
              color:#6B7280;
            "
          >
            Crie um departamento ou um subtime.
          </p>

        </div>

        <button
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
          Nome
        </label>

        <input
          id="team-name"
          class="portal-input"
          placeholder="Ex.: Tesouraria"
        />

      </div>

      <div class="portal-form-group">

        <label class="portal-label">
          Descrição
        </label>

        <textarea
          id="team-description"
          class="portal-textarea"
          placeholder="Descreva rapidamente a finalidade deste time..."
        ></textarea>

      </div>

      <div class="portal-form-group">

        <label class="portal-label">
          Estrutura
        </label>

        <div class="portal-options">

          <div
            id="department-card"
            class="portal-option active"
            onclick="selectTeamType('department')"
          >

            <div class="portal-option-title">
              🏢 Departamento
            </div>

            <div class="portal-option-subtitle">
              Time principal da empresa.
            </div>

          </div>

          <div
            id="subteam-card"
            class="portal-option"
            onclick="selectTeamType('subteam')"
          >

            <div class="portal-option-title">
              👥 Subtime
            </div>

            <div class="portal-option-subtitle">
              Faz parte de um departamento.
            </div>

          </div>

        </div>

      </div>

      <div
        id="department-container"
        class="portal-form-group"
        style="display:none;"
      >

        <label class="portal-label">
          Departamento
        </label>

        <select
          id="team-group"
          class="portal-select"
        >

          <option value="">
            Selecione...
          </option>

          ${departments
            .map(team => `
              <option value="${team.name}">
                ${team.name}
              </option>
            `)
            .join("")}

        </select>

      </div>

      <div class="portal-modal-footer">

        <button
          class="btn-secondary"
          onclick="closePortalModal()"
        >
          Cancelar
        </button>

        <button
          class="btn-primary"
          onclick="createTeam()"
        >
          ➕ Criar Time
        </button>

      </div>

    </div>

    

  `;

}