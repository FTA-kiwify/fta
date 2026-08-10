import type { TaskDetails } from "../../services/portal/taskDetailsService";

export function taskPage(
    task: TaskDetails
) {

    return `
    <div class="card">

      <h1>
        📌 ${task.title}
      </h1>

      <p>
        Esta será a tela de detalhes da tarefa.
      </p>

      <hr style="margin:24px 0;">

      <p><b>Responsável:</b> ${task.responsible}</p>

      <p><b>Delegado por:</b> ${task.delegatedBy ?? "-"}</p>

      <p><b>Urgência:</b> ${task.urgency}</p>

      <p><b>Recorrência:</b> ${task.recurrence ?? "-"}</p>

      <p><b>Descrição:</b></p>

      <p>${task.description ?? "-"}</p>

    </div>
  `;

}