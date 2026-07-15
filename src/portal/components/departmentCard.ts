
type DepartmentCardProps = {
  id: string;
  name: string;
  members: number;
  openTasks: number;
  todayTasks: number;

  subtitle?: string;
  footer?: string;
  icon?: string;
};


export function departmentCard({
  id,
  name,
  members,
  openTasks,
  todayTasks,
  subtitle = "Departamento",
  footer = "Clique para visualizar.",
  icon = "💰",
}: DepartmentCardProps) {

  return `
    <div
      class="card"
      onclick="window.location='/portal/teams/${id}'"
      style="
        cursor:pointer;
        margin-bottom:24px;
        transition:.15s;
      "
      onmouseover="this.style.transform='translateY(-2px)'"
      onmouseout="this.style.transform='translateY(0)'"
    >

      <div style="margin-bottom:28px;">

  <h2
    style="
      margin:0;
      font-size:30px;
    "
  >
    ${icon} ${name}
  </h2>

  <div
    style="
      color:#6B7280;
      margin-top:8px;
    "
  >
    ${subtitle}
  </div>

  <div
    style="
      display:flex;
      gap:28px;
      margin-top:22px;
      color:#374151;
      font-weight:600;
      font-size:15px;
      flex-wrap:wrap;
    "
  >

    <span>👥 ${members} colaboradores</span>

    <span>📋 ${openTasks} tarefas</span>

    <span>📅 ${todayTasks} hoje</span>

  </div>

</div>

      <div
        style="
          color:#6B7280;
          font-size:15px;
        "
      >
        ${footer}
      </div>

    </div>

  `;

}