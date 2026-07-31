import { Department } from "../../services/portal/processDepartmentsService";
import { processDepartmentCard } from "../components/processDepartmentCard";

export function processesPage(
  departments: Department[]
) {

  return `

    ${departments
      .map(department =>
        processDepartmentCard({
          name: department.name,
          processCount: department.processCount,
          href: `/portal/processes/department/${encodeURIComponent(department.name)}`
        })
      )
      .join("")}

  `;

}