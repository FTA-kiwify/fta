type AccessDeniedPageArgs = {
  message: string;
  backHref: string;
};

export function accessDeniedPage({
  message,
  backHref,
}: AccessDeniedPageArgs) {
  return `
    <div
      style="
        padding:28px;
      "
    >
      <div
        style="
          max-width:620px;
          background:#FFFFFF;
          border:1px solid #E5E7EB;
          border-radius:16px;
          padding:32px;
          box-shadow:0 4px 16px rgba(0,0,0,.05);
        "
      >
        <div
          style="
            width:48px;
            height:48px;
            border-radius:14px;
            background:#F3F4F6;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:24px;
            margin-bottom:20px;
          "
        >
          🔒
        </div>

        <h2
          style="
            margin:0 0 10px;
            font-size:22px;
            color:#111827;
          "
        >
          Acesso não permitido
        </h2>

        <p
          style="
            margin:0;
            font-size:14px;
            line-height:1.6;
            color:#6B7280;
          "
        >
          ${message}
        </p>

        <p
          style="
            margin:6px 0 0;
            font-size:14px;
            line-height:1.6;
            color:#6B7280;
          "
        >
          O acesso ao conteúdo é limitado ao seu departamento.
        </p>

        <a
          href="${backHref}"
          style="
            display:inline-flex;
            align-items:center;
            margin-top:24px;
            padding:10px 16px;
            border-radius:10px;
            background:#F3F4F6;
            color:#374151;
            text-decoration:none;
            font-size:14px;
            font-weight:600;
          "
        >
          ← Voltar
        </a>
      </div>
    </div>
  `;
}