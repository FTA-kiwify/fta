type TopbarProps = {
  title: string;
  searchPlaceholder?: string;
};

export function topbar({
  title,
  searchPlaceholder,
}: TopbarProps) {

  return `
    <header
      style="
        height:72px;
        background:white;
        border-bottom:1px solid #E5E7EB;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 32px;
      "
    >

      <div>

        <h2
          style="
            font-size:24px;
            margin:0;
          "
        >
          ${title}
        </h2>

      </div>

      <div
        style="
          display:flex;
          align-items:center;
          gap:16px;
        "
      >

        ${
          searchPlaceholder
            ? `
              <input
                id="portal-search"
                placeholder="${searchPlaceholder}"
                style="
                  padding:10px 14px;
                  border-radius:12px;
                  border:1px solid #D1D5DB;
                  width:240px;
                  font-size:14px;
                  outline:none;
                "
              />
            `
            : ""
        }

        <div
          style="
            width:42px;
            height:42px;
            border-radius:50%;
            background:#5B6CFF;
            color:white;
            display:flex;
            justify-content:center;
            align-items:center;
            font-weight:700;
            font-size:16px;
            flex-shrink:0;
          "
        >
          L
        </div>

      </div>

    </header>
  `;

}