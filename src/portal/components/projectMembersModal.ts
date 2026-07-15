type ProjectMember = {
  slackUserId: string;
  name: string;
};

type ProjectMembersModalProps = {
  projectName: string;
  members: ProjectMember[];
};

export function projectMembersModal({
  projectName,
  members,
}: ProjectMembersModalProps) {

  return `
    <div style="padding:32px;">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:28px;
        "
      >

        <h2 style="margin:0;">
          👥 Membros — ${projectName}
        </h2>

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
        members.length
          ? members
              .map(member => `
                <div
                  onclick="window.location='/portal/collaborators/${member.slackUserId}'"
                  style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                    padding:16px 0;
                    border-bottom:1px solid #E5E7EB;
                    cursor:pointer;
                    transition:background .15s;
                  "
                  onmouseover="this.style.background='#F9FAFB'"
                  onmouseout="this.style.background='transparent'"
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
                      flex-shrink:0;
                    "
                  >
                    ${member.name.charAt(0).toUpperCase()}
                  </div>

                  <div>

                    <div style="font-weight:600;">
                      ${member.name}
                    </div>

                    <div
                      style="
                        color:#6B7280;
                        font-size:13px;
                        margin-top:4px;
                      "
                    >
                      ${member.slackUserId}
                    </div>

                  </div>

                </div>
              `)
              .join("")
          : `
              <p>
                Nenhum membro encontrado.
              </p>
            `
      }

    </div>
  `;

}