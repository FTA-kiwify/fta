type ProcessDepartmentCardProps = {
  name: string;
  processCount: number;
  href: string;
};

export function processDepartmentCard({
  name,
  processCount,
  href,
}: ProcessDepartmentCardProps) {

  return `
    <div
      class="card"
      onclick="window.location='${href}'"
      style="
        cursor:pointer;
        margin-bottom:24px;
        transition:.15s;
      "
      onmouseover="this.style.transform='translateY(-2px)'"
      onmouseout="this.style.transform='translateY(0)'"
    >

      <div style="margin-bottom:28px;">

        <h2 style="margin:0;font-size:30px;">
          💰 ${name}
        </h2>

        <div
          style="
            color:#6B7280;
            margin-top:8px;
          "
        >
          Departamento
        </div>

        <div
          style="
            display:flex;
            gap:28px;
            margin-top:22px;
            color:#374151;
            font-weight:600;
            font-size:15px;
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