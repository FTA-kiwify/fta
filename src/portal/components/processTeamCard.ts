
type ProcessTeamCardProps = {
  id: string;
  name: string;
  processCount: number;
};


export function processTeamCard({
  id,
  name,
  processCount,
}: DepartmentCardProps) {
const cardHref = `/portal/processes/team/${id}`;
  return `
    <div
      class="card"
      onclick="window.location='${cardHref}'"
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
    🏢 ${name}
  </h2>

  <div
    style="
      color:#6B7280;
      margin-top:8px;
    "
  >
    Subárea
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

    <span>📂 ${processCount} processos</span>



  </div>

</div>

      <div
        style="
          color:#6B7280;
          font-size:15px;
        "
      >
        Clique para visualizar os processos.
      </div>

    </div>

  `;

}