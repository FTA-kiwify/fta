export function topbar(title: string) {
  return `
    <header
      style="
        height:72px;
        background:white;
        border-bottom:1px solid #e5e7eb;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 32px;
      "
    >

      <div>

        <h2 style="font-size:24px;">${title}</h2>

      </div>

      <div
        style="
          display:flex;
          align-items:center;
          gap:16px;
        "
      >

        <input
          placeholder="Pesquisar..."
          style="
            padding:10px 14px;
            border-radius:12px;
            border:1px solid #ddd;
            width:240px;
          "
        />

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
            font-weight:bold;
          "
        >
          L
        </div>

      </div>

    </header>
  `;
}