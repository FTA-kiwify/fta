import { prisma } from "../../lib/prisma";
import { loadNotionTree } from "../notion/loadNotionTree";
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

  const blocks = await loadNotionTree(
    process.notionPageId
  );

  return {
    process,
    content: await renderNotionBlocks(blocks),
  };

}