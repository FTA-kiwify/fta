export function processPage(
  process: any,
  content: string
) {

  return `

    <div class="card">

      <h1
        style="
          margin-bottom:32px;
        "
      >
        ${process.title}
      </h1>

      <div
        class="notion-content"
      >
        ${content}
      </div>

    </div>

  `;

}