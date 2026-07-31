import { Department } from "../../services/portal/processDepartmentsService";
import { departmentCard } from "../components/departmentCard";

export function processesPage(
  departments: Department[]
) {

  return `

    ${departments
      .map(department =>
        departmentCard({
          id: department.name,
          name: department.name,
          members: department.processCount,
          openTasks: 0,
          todayTasks: 0,
          subtitle: "Departamento",
          footer: "Clique para visualizar os processos.",
          icon: "💰",
          href: `/portal/processes/department/${encodeURIComponent(department.name)}`
        })
      )
      .join("")}

  `;

}