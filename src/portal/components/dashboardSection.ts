type DashboardSectionProps = {
  title: string;
  body: string;
  compact?: boolean;
};

export function dashboardSection({
  title,
  body,
  compact = false,
}: DashboardSectionProps) {
  return `
    <div class="card ${compact ? "" : "dashboard-section"}">

      <h2 class="dashboard-section-title">

        ${title}

      </h2>

      ${body}

    </div>
  `;
}