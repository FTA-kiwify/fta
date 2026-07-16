type Team = {
  id: string;
  name: string;
  group: string | null;
};

type Props = {
  currentTeamId: string;
  slackUserId: string;
  memberName: string;
  teams: Team[];
};

export function moveMemberModal({
  currentTeamId,
  slackUserId,
  memberName,
  teams,
}: Props) {

  return `
    <div style="padding:32px;">

      <h2>
        🔄 Mover colaborador
      </h2>

      <p style="margin-bottom:24px;">
        ${memberName}
      </p>

      <select
        id="move-team"
        style="
          width:100%;
          padding:14px;
          border-radius:12px;
          margin-bottom:24px;
        "
      >

        ${teams
          .filter(team => team.id !== currentTeamId)
          .map(team => `
            <option value="${team.id}">
              ${team.group
                ? `${team.group} • ${team.name}`
                : team.name}
            </option>
          `)
          .join("")}

      </select>

      <button
        class="btn-primary"
        style="width:100%;"
        onclick="moveMember(
          '${currentTeamId}',
          '${slackUserId}'
        )"
      >
        Mover
      </button>

    </div>
  `;

}