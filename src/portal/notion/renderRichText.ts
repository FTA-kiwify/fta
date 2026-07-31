function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderRichText(
  richText: any[]
) {

  return richText
    .map(renderItem)
    .join("");

}

function renderItem(item: any) {

  let text = escapeHtml(item.plain_text);

  const annotations = item.annotations;

  if (annotations.bold)
    text = `<strong>${text}</strong>`;

  if (annotations.italic)
    text = `<em>${text}</em>`;

  if (annotations.strikethrough)
    text = `<del>${text}</del>`;

  if (annotations.underline)
    text = `<u>${text}</u>`;

  if (annotations.code)
    text = `<code>${text}</code>`;

  if (item.href) {
    text = `
      <a
        href="${item.href}"
        target="_blank"
      >
        ${text}
      </a>
    `;
  }

  return text;

}