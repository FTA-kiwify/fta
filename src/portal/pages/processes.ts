import { type ProcessTree } from "../../services/portal/processService";

export function processesPage(
  tree: ProcessTree[]
) {

  return `

    <div class="card">

      <pre>
${JSON.stringify(tree, null, 2)}
      </pre>

    </div>

  `;

}