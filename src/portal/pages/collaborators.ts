import { collaboratorCard } from "../components/collaboratorCard";
import type { Collaborator } from "../../services/portal/collaboratorService";

export function collaboratorsPage(
  collaborators: Collaborator[]
) {
  return `
    <div class="card">

      <h1>👥 Colaboradores</h1>

      <p>
        Visualize colaboradores, projetos e atividades.
      </p>

    </div>

    <div class="collaborator-list">

      ${collaborators
        .map(collaborator => collaboratorCard(collaborator))
        .join("")}

    </div>
  `;
}