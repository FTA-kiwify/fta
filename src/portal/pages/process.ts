export function processPage(
  process: any,
  blocks: any[]
) {

  return `

    <div class="card">

      <h1>${process.title}</h1>

      <pre
        style="
          white-space:pre-wrap;
          overflow:auto;
          font-size:12px;
          background:#F9FAFB;
          padding:16px;
          border-radius:8px;
        "
      >
${JSON.stringify(blocks, null, 2)}
      </pre>

    </div>

  `;

}