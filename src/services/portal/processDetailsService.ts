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

    console.log("PAGE ID:", process.notionPageId);
    console.log("PAGE URL:", process.notionPageUrl);

    const blocks = await loadNotionTree(
        process.notionPageId
    );
    console.log("BLOCKS:", blocks.length);

    const content = await renderNotionBlocks(blocks);

    console.log("BLOCKS:", blocks.length);
    console.log("CONTENT:", content.length);

    return {
        process,
        content,
    };

}