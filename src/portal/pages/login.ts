export function portalLoginPage() {

  return `
    <div
      style="
        min-height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        background:#F3F4F6;
      "
    >

      <div
        style="
          width:420px;
          background:white;
          border-radius:18px;
          padding:40px;
          box-shadow:0 8px 30px rgba(0,0,0,.08);
          text-align:center;
        "
      >

        <h1
          style="
            margin:0 0 12px;
            font-size:28px;
          "
        >
          FTA Portal
        </h1>

        <p
          style="
            color:#6B7280;
            margin-bottom:36px;
            line-height:1.6;
          "
        >
          Entre utilizando sua conta do Slack.
        </p>

        <a
          href="/auth/slack"
          style="
            display:inline-block;
            background:#4A154B;
            color:white;
            text-decoration:none;
            padding:14px 22px;
            border-radius:12px;
            font-weight:600;
            width:100%;
            box-sizing:border-box;
          "
        >
          Entrar com Slack
        </a>

      </div>

    </div>
  `;

}