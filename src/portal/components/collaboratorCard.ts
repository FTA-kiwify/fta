import type { Collaborator } from "../../services/portal/collaboratorService";

export function collaboratorCard(
  collaborator: Collaborator
) {

  const initial = collaborator.name.charAt(0).toUpperCase();

  return `
    <div class="collaborator-card">

      <div class="collaborator-avatar">

        ${initial}

      </div>

      <div class="collaborator-info">

        <h3>${collaborator.name}</h3>

        <p>${collaborator.slackUserId}</p>

        <div class="collaborator-stats">

          <span>📋 ${collaborator.totalTasks} tarefas</span>

        </div>

      </div>

      <a
        class="button-primary"
        href="/portal/collaborators/${collaborator.slackUserId}"
      >
        Ver detalhes →
      </a>

    </div>
  `;
}