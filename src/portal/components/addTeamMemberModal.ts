type Collaborator = {
  slackUserId: string;
  name: string;
};

type AddTeamMemberModalProps = {
  teamId: string;
  collaborators: Collaborator[];
};

export function addTeamMemberModal({
  teamId,
  collaborators,
}: AddTeamMemberModalProps) {

  return `
    <div style="padding:32px;">

      <div class="portal-modal-header">

        <div>

          <h2 style="margin:0;">
            ➕ Adicionar membro
          </h2>

          <p
            style="
              margin-top:6px;
              color:#6B7280;
            "
          >
            Selecione um colaborador para adicionar ao time.
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

      ${
        collaborators.length

          ? collaborators.map(member => `

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  padding:16px 0;
                  border-bottom:1px solid #E5E7EB;
                "
              >

                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                  "
                >

                  <div
                    style="
                      width:42px;
                      height:42px;
                      border-radius:50%;
                      background:#27C27A;
                      color:white;
                      display:flex;
                      justify-content:center;
                      align-items:center;
                      font-weight:700;
                    "
                  >
                    ${member.name.charAt(0).toUpperCase()}
                  </div>

                  <div style="font-weight:600;">
                    ${member.name}
                  </div>

                </div>

                <button
                  class="btn-primary"
                  onclick="addMember('${teamId}','${member.slackUserId}')"
                >
                  Adicionar
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
              Todos os colaboradores já pertencem a este time.
            </p>

          `

      }

    </div>
  `;

}