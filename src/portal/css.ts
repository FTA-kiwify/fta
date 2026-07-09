export function portalCss() {
  return `
    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
    }

    :root{
      --bg:#F6F8FB;

      --sidebar:#0F7A55;
      --sidebar-hover:#169866;

      --card:#FFFFFF;

      --text:#1F2937;
      --muted:#6B7280;

      --primary:#27C27A;

      --border:#E5E7EB;
    }

    body{
      font-family:Inter,system-ui,-apple-system,sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    a{
      color:inherit;
      text-decoration:none;
    }

    .layout{
      display:flex;
      min-height:100vh;
    }

    .content{
      flex:1;
      padding:32px;
    }

    .card{
      background:var(--card);
      border-radius:18px;
      padding:28px;
      box-shadow:
        0 10px 30px rgba(15,23,42,.05),
        0 2px 8px rgba(15,23,42,.04);
    }

    h1{
      font-size:36px;
      margin-bottom:12px;
      font-weight:700;
    }

    p{
      color:var(--muted);
      font-size:18px;
      line-height:1.6;
    }

    .sidebar-link{
      display:flex;
      align-items:center;
      gap:12px;

      padding:12px 14px;

      border-radius:12px;

      color:white;

      transition:.2s;
      font-weight:500;
    }

    .sidebar-link:hover{
      background:var(--sidebar-hover);
    }

    .sidebar-link.active{
      background:rgba(255,255,255,.15);
    }

  `;
}