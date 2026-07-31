import { notion } from "./client";

export async function getProcessBlocks(
  pageId: string
) {

  console.log("PAGE ID:", pageId);

  const page = await notion.pages.retrieve({
    page_id: pageId,
  });

  console.log("PAGE:", JSON.stringify(page, null, 2));

  const blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  console.log("BLOCKS:", JSON.stringify(blocks, null, 2));

  return blocks.results;

}