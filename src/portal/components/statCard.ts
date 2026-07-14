type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
  onclick?: string;
};

export function statCard({
  title,
  value,
  icon,
  color = "#22C55E",
  subtitle,
  onclick,
}: StatCardProps) {
  return `
    <div
      class="stat-card"
      ${onclick ? `onclick="${onclick}"` : ""}
      style="${onclick ? "cursor:pointer;" : ""}"
      ${onclick
        ? `
          onmouseover="this.style.transform='translateY(-2px)'"
          onmouseout="this.style.transform='translateY(0)'"
        `
        : ""
      }
    >

      <div>

        <div class="stat-title">
          ${title}
        </div>

        <div class="stat-value">
          ${value}
        </div>

        ${
          subtitle
            ? `<div class="stat-subtitle">${subtitle}</div>`
            : ""
        }

      </div>

      <div
        class="stat-icon"
        style="background:${color}"
      >
        ${icon}
      </div>

    </div>
  `;
}