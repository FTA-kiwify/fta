type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  subtitle?: string;
};

export function statCard({
  title,
  value,
  icon,
  color = "#22C55E",
  subtitle,
}: StatCardProps) {
  return `
    <div class="stat-card">

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