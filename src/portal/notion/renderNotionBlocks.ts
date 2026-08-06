import type { NotionBlock } from "../../services/notion/notionBlock";
import { renderRichText } from "./renderRichText";

export async function renderNotionBlocks(
    blocks: NotionBlock[]
): Promise<string> {

    const html: string[] = [];

    for (const block of blocks) {
        html.push(await renderBlock(block));
    }

    return html.join("");

}

async function renderBlock(
    block: NotionBlock
): Promise<string> {

    const raw = block.raw;

    switch (block.type) {

        case "heading_1":
            return `
        <h1 style="margin:28px 0 12px;">
          ${renderRichText(raw.heading_1.rich_text)}
        </h1>
      `;

        case "heading_2":
            return `
        <h2 style="margin:24px 0 10px;">
          ${renderRichText(raw.heading_2.rich_text)}
        </h2>
      `;

        case "heading_3":
            return `
        <h3 style="margin:20px 0 8px;">
          ${renderRichText(raw.heading_3.rich_text)}
        </h3>
      `;

        case "paragraph": {

            const content = renderRichText(
                raw.paragraph.rich_text
            );

            if (!content.trim()) {
                return `<div style="height:10px;"></div>`;
            }

            return `
        <p
          style="
            margin:8px 0;
            line-height:1.7;
            white-space:pre-wrap;
          "
        >
          ${content}
        </p>
      `;
        }

        case "bulleted_list_item": {

            const children =
                block.children.length > 0
                    ? await renderNotionBlocks(block.children)
                    : "";

            return `
        <div
          style="
            display:flex;
            gap:10px;
            margin:6px 0;
            padding-left:12px;
          "
        >

          <span>•</span>

          <div>

            ${renderRichText(
                raw.bulleted_list_item.rich_text
            )}

            ${children
                    ? `
                    <div
                      style="
                        margin-left:20px;
                        margin-top:6px;
                      "
                    >
                      ${children}
                    </div>
                  `
                    : ""
                }

          </div>

        </div>
      `;
        }

        case "numbered_list_item": {

            const children =
                block.children.length > 0
                    ? await renderNotionBlocks(block.children)
                    : "";

            return `
        <div
          style="
            margin:8px 0;
            padding-left:12px;
          "
        >

          <div style="font-weight:600;">

            ${renderRichText(
                raw.numbered_list_item.rich_text
            )}

          </div>

          ${children
                    ? `
                  <div
                    style="
                      margin-top:8px;
                      margin-left:20px;
                    "
                  >
                    ${children}
                  </div>
                `
                    : ""
                }

        </div>
      `;
        }

        case "to_do": {

            const children =
                block.children.length
                    ? await renderNotionBlocks(block.children)
                    : "";

            return `
    <div
      style="
        display:flex;
        gap:10px;
        align-items:flex-start;
        margin:8px 0;
      "
    >

      <input
        type="checkbox"
        disabled
        ${raw.to_do.checked ? "checked" : ""}
      />

      <div>

        ${renderRichText(raw.to_do.rich_text)}

        ${children
                    ? `
                <div
                  style="
                    margin-left:24px;
                    margin-top:8px;
                  "
                >
                  ${children}
                </div>
              `
                    : ""
                }

      </div>

    </div>
  `;
        }

        case "callout": {

            const children =
                block.children.length
                    ? await renderNotionBlocks(block.children)
                    : "";

            return `
    <div
      style="
        display:flex;
        gap:12px;
        align-items:flex-start;
        padding:16px;
        margin:16px 0;
        border-radius:8px;
        background:#F8F9FA;
        border:1px solid #E5E7EB;
      "
    >

      <div
        style="
          font-size:22px;
          line-height:1;
        "
      >
        ${raw.callout.icon?.emoji ?? "💬"}
      </div>

      <div style="flex:1;">

        ${renderRichText(raw.callout.rich_text)}

        ${children
                    ? `
              <div
                style="
                  margin-top:12px;
                "
              >
                ${children}
              </div>
            `
                    : ""
                }

      </div>

    </div>
  `;
        }

        case "toggle": {

            const children =
                block.children.length > 0
                    ? await renderNotionBlocks(block.children)
                    : "";

            return `
        <details
          style="
            margin:12px 0;
            border:1px solid #E5E7EB;
            border-radius:8px;
            padding:12px 14px;
          "
        >

          <summary
            style="
              cursor:pointer;
              font-weight:600;
              user-select:none;
            "
          >
            ${renderRichText(
                raw.toggle.rich_text
            )}
          </summary>

          ${children
                    ? `
                  <div
                    style="
                      margin-top:12px;
                      padding-left:10px;
                    "
                  >
                    ${children}
                  </div>
                `
                    : ""
                }

        </details>
      `;
        }
        case "quote": {

            return `
    <blockquote
      style="
        margin:16px 0;
        padding:8px 16px;
        border-left:4px solid #D1D5DB;
        color:#4B5563;
        font-style:italic;
        line-height:1.7;
      "
    >
      ${renderRichText(raw.quote.rich_text)}
    </blockquote>
  `;
        }
        case "code": {

            return `
    <pre
      style="
        background:#111827;
        color:#F9FAFB;
        padding:16px;
        border-radius:8px;
        overflow:auto;
        margin:16px 0;
      "
    ><code>${renderRichText(raw.code.rich_text)}</code></pre>
  `;
        }
        case "image": {

            const image =
                raw.image.type === "external"
                    ? raw.image.external.url
                    : raw.image.file.url;

            return `
    <div
      style="
        margin:24px 0;
        text-align:center;
      "
    >

      <img
        src="${image}"
        style="
          max-width:100%;
          border-radius:8px;
          border:1px solid #E5E7EB;
        "
      />

      ${raw.image.caption.length
                    ? `
              <div
                style="
                  margin-top:8px;
                  color:#6B7280;
                  font-size:14px;
                "
              >
                ${renderRichText(raw.image.caption)}
              </div>
            `
                    : ""
                }

    </div>
  `;
        }
        case "bookmark": {

            return `
    <a
      href="${raw.bookmark.url}"
      target="_blank"
      style="
        display:block;
        padding:16px;
        border:1px solid #E5E7EB;
        border-radius:8px;
        text-decoration:none;
        color:inherit;
        margin:16px 0;
      "
    >

      🔖

      ${raw.bookmark.url}

    </a>
  `;
        }
        case "file":
        case "pdf": {

            const file =
                raw[block.type].type === "external"
                    ? raw[block.type].external.url
                    : raw[block.type].file.url;

            return `
    <div
      style="
        margin:16px 0;
      "
    >

      📎

      <a
        href="${file}"
        target="_blank"
      >
        Abrir arquivo
      </a>

    </div>
  `;
        }
        case "video": {

            const video =
                raw.video.type === "external"
                    ? raw.video.external.url
                    : raw.video.file.url;

            return `
    <div style="margin:24px 0;">

      <video
        controls
        style="
          width:100%;
          border-radius:8px;
        "
      >
        <source src="${video}">
      </video>

    </div>
  `;
        }
        case "embed": {

            return `
    <iframe
      src="${raw.embed.url}"
      style="
        width:100%;
        height:600px;
        border:none;
        border-radius:8px;
        margin:20px 0;
      "
    ></iframe>
  `;
        }
        case "child_page": {

            return `
    <div
      style="
        margin:16px 0;
        padding:16px;
        border:1px solid #E5E7EB;
        border-radius:8px;
      "
    >

      📄

      ${raw.child_page.title}

    </div>
  `;
        }

        case "table": {

            return `
    <table
      style="
        width:100%;
        border-collapse:collapse;
        margin:20px 0;
      "
    >
      ${await renderNotionBlocks(block.children)}
    </table>
  `;
        }

        case "table_row": {

            const cells = raw.table_row.cells;

            return `
    <tr>

      ${cells.map((cell: any) => `
        <td
          style="
            border:1px solid #E5E7EB;
            padding:10px;
            vertical-align:top;
          "
        >
          ${renderRichText(cell)}
        </td>
      `).join("")}

    </tr>
  `;
        }
        case "column_list": {

            return `
    <div
      style="
        display:flex;
        gap:24px;
        align-items:flex-start;
        margin:20px 0;
      "
    >
      ${await renderNotionBlocks(block.children)}
    </div>
  `;
        }
        case "column": {

            return `
    <div
      style="
        flex:1;
      "
    >
      ${await renderNotionBlocks(block.children)}
    </div>
  `;
        }
        case "synced_block": {

            return await renderNotionBlocks(
                block.children
            );

        }
        case "table_of_contents": {

            return `
    <div
      style="
        padding:12px;
        margin:20px 0;
        border:1px solid #E5E7EB;
        border-radius:8px;
        color:#6B7280;
      "
    >
      📑 Índice (Table of Contents)
    </div>
  `;
        }
        case "breadcrumb": {

            return "";

        }
        case "equation": {

            return `
    <pre
      style="
        background:#F9FAFB;
        padding:12px;
        border-radius:8px;
      "
    >
${raw.equation.expression}
    </pre>
  `;
        }
        case "child_database":

            return `
    <div
      style="
        margin:20px 0;
        padding:18px;
        border:1px solid #E5E7EB;
        border-radius:12px;
        background:#F9FAFB;
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:600;
          margin-bottom:8px;
        "
      >
        📋 Banco de dados do Notion
      </div>

      <div
        style="
          color:#374151;
          margin-bottom:18px;
        "
      >
        ${raw.child_database.title}
      </div>

      <div
        style="
          color:#6B7280;
          font-size:14px;
        "
      >
        Este banco de dados deve ser consultado diretamente no Notion.
      </div>

    </div>
  `;
        case "divider":
            return `
        <hr
          style="
            margin:24px 0;
            border:none;
            border-top:1px solid #E5E7EB;
          "
        />
      `;

        default:
            return `
    <div
      style="
        margin:16px 0;
        padding:16px;
        border:1px dashed #F59E0B;
        border-radius:8px;
        background:#FEFCE8;
      "
    >

      <strong>⚠️ Bloco não implementado:</strong>

      ${block.type}

      <details style="margin-top:12px;">

        <summary>Ver JSON</summary>

        <pre
          style="
            overflow:auto;
            font-size:12px;
            margin-top:12px;
          "
        >${JSON.stringify(raw, null, 2)}</pre>

      </details>

    </div>
  `;
    }

}