type Team = {
  id: string;
  name: string;
  group: string | null;
  members: number;
  openTasks: number;
  todayTasks: number;
};

export function teamCard(team: Team) {

  return `
    <div
      class="collaborator-card"
      data-search="${`${team.name} ${team.group ?? ""}`.toLowerCase()}"
      onclick="window.location='/portal/teams/${team.id}'"
      style="cursor:pointer;"
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
        "
      >

        <div>

          <h3 style="margin:0;">
            👥 ${team.name}
          </h3>

          ${
            team.group
              ? `
                <div
                  style="
                    color:#6B7280;
                    margin-top:6px;
                    font-size:14px;
                  "
                >
                  ${team.group}
                </div>
              `
              : ""
          }

        </div>

        <div
          style="
            text-align:right;
            color:#6B7280;
            font-size:14px;
          "
        >

          <div>${team.members} membro(s)</div>
          <div>${team.openTasks} tarefas</div>

        </div>

      </div>

      ${
        team.todayTasks > 0
          ? `
            <div
              style="
                margin-top:16px;
                color:#F59E0B;
                font-weight:600;
              "
            >
              📅 ${team.todayTasks} vencem hoje
            </div>
          `
          : ""
      }

    </div>
  `;

}