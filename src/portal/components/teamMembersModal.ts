type TeamMember = {
    slackUserId: string;
    name: string;
    openTasks: number;
};

type TeamMembersModalProps = {
    teamId: string;
    teamName: string;
    members: TeamMember[];
};

export function teamMembersModal({
    teamId,
    teamName,
    members,
}: TeamMembersModalProps) {

    return `
    <div style="padding:32px;">

      <div
        class="portal-modal-header"
      >

        <div>

          <h2
            style="
              margin:0;
              font-size:28px;
            "
          >
            👥 Equipe
          </h2>

          <p
            style="
              margin-top:6px;
              color:#6B7280;
            "
          >
            ${teamName}
          </p>

        </div>

        <div
          style="
            display:flex;
            gap:12px;
            align-items:center;
          "
        >

          <button
            class="btn-primary"
            onclick="openPortalModal('/portal/teams/${teamId}/members/add/modal')"
          >
            ➕ Adicionar
          </button>

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

      </div>

      ${members.length

            ? members.map(member => `

              <div
                style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  padding:18px 0;
                  border-bottom:1px solid #E5E7EB;
                "
              >

                <div
                  onclick="window.location='/portal/collaborators/${member.slackUserId}'"
                  style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                    cursor:pointer;
                  "
                >

                  <div
                    style="
                      width:46px;
                      height:46px;
                      border-radius:50%;
                      background:#27C27A;
                      color:white;
                      display:flex;
                      justify-content:center;
                      align-items:center;
                      font-weight:700;
                      font-size:18px;
                    "
                  >
                    ${member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>

                    <div
                      style="
                        font-weight:600;
                        margin-bottom:4px;
                      "
                    >
                      ${member.name}
                    </div>

                    <div
                      style="
                        color:#6B7280;
                        font-size:14px;
                      "
                    >
                      📋 ${member.openTasks} tarefa${member.openTasks !== 1 ? "s" : ""}
                    </div>

                  </div>

                </div>

                <button
  class="btn-secondary"
  onclick="removeMember('${teamId}','${member.slackUserId}')"
>
  ❌
</button>

              </div>

            `).join("")

            : `

            <p
              style="
                color:#6B7280;
                padding:24px 0;
              "
            >
              Nenhum membro encontrado.
            </p>

          `

        }

    </div>
  `;

}