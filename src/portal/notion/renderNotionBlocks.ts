export function renderNotionBlocks(blocks: any[]) {
  return blocks.map(renderBlock).join("");
}

function renderBlock(block: any) {
  switch (block.type) {

    case "heading_1":
      return `<h1>${rich(block.heading_1.rich_text)}</h1>`;

    case "heading_2":
      return `<h2>${rich(block.heading_2.rich_text)}</h2>`;

    case "heading_3":
      return `<h3>${rich(block.heading_3.rich_text)}</h3>`;

    case "paragraph":
      return `<p>${rich(block.paragraph.rich_text)}</p>`;

    case "bulleted_list_item":
      return `<li>${rich(block.bulleted_list_item.rich_text)}</li>`;

    case "numbered_list_item":
      return `<li>${rich(block.numbered_list_item.rich_text)}</li>`;

    case "divider":
      return `<hr/>`;

    default:
      return "";
  }
}

function rich(items: any[]) {

  return items
    .map((item) => item.plain_text)
    .join("");

}