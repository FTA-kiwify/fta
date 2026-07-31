import { prisma } from "../../lib/prisma";
import { loadNotionTree } from "../notion/loadNotionTree";
import { extractNotionPageId } from "../notion/extractNotionPageId";
import { renderNotionBlocks } from "../../portal/notion/renderNotionBlocks";

export async function getProcessDetails(
  processId: string
) {

  const process = await prisma.process.findUnique({
    where: {
      id: processId,
    },
  });

  if (!process) {
    return null;
  }

  const realNotionPageId =
    extractNotionPageId(process.notionPageUrl);

  const blocks = await loadNotionTree(
    realNotionPageId
  );

  const content = await renderNotionBlocks(
    blocks
  );

  return {
    process,
    content,
  };
}