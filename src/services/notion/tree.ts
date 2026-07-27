import type {
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { notion } from "./client";

type NotionSearchPage = PageObjectResponse | PartialPageObjectResponse;

export type NotionPageNode = {
  notionPageId: string;
  title: string;
  url: string | null;
  parentPageId: string | null;

  depth: number;
  children: NotionPageNode[];
};

function isFullPage(
  page: NotionSearchPage,
): page is PageObjectResponse {
  return "properties" in page;
}

function getPageTitle(page: PageObjectResponse): string {
  const titleProperty = Object.values(page.properties).find(
    (property) => property.type === "title",
  );

  if (!titleProperty || titleProperty.type !== "title") {
    return "Sem título";
  }

  const title = titleProperty.title
    .map((item) => item.plain_text)
    .join("")
    .trim();

  return title || "Sem título";
}

function getParentPageId(page: PageObjectResponse): string | null {
  if (page.parent.type === "page_id") {
    return page.parent.page_id;
  }

  /*
   * Algumas páginas podem estar dentro de blocos, databases,
   * data sources ou diretamente no workspace.
   *
   * Nesta primeira versão, apenas parent.page_id forma a
   * hierarquia entre páginas.
   */
  return null;
}

async function searchAllPages(): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];

  let startCursor: string | undefined;

  do {
    const response = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      page_size: 100,
      start_cursor: startCursor,
    });

    for (const result of response.results) {
      if (result.object !== "page") {
        continue;
      }

      if (!isFullPage(result)) {
        continue;
      }

      if (result.in_trash || result.archived) {
        continue;
      }

      pages.push(result);
    }

    startCursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (startCursor);

  return pages;
}

function calculateDepth(
  node: NotionPageNode,
  nodesById: Map<string, NotionPageNode>,
): number {
  const visited = new Set<string>();

  let depth = 0;
  let currentNode: NotionPageNode | undefined = node;

  while (currentNode?.parentPageId) {
    if (visited.has(currentNode.notionPageId)) {
      console.warn(
        `Ciclo detectado na hierarquia do Notion: ${currentNode.title}`,
      );

      break;
    }

    visited.add(currentNode.notionPageId);

    const parent = nodesById.get(currentNode.parentPageId);

    if (!parent) {
      break;
    }

    depth += 1;
    currentNode = parent;
  }

  return depth;
}

export async function buildNotionPageTree(): Promise<{
  pages: NotionPageNode[];
  roots: NotionPageNode[];
}> {
  const notionPages = await searchAllPages();

  const pages: NotionPageNode[] = notionPages.map((page) => ({
    notionPageId: page.id,
    title: getPageTitle(page),
    url: page.url || null,
    parentPageId: getParentPageId(page),
    depth: 0,
    children: [],
  }));

  const nodesById = new Map(
    pages.map((page) => [page.notionPageId, page]),
  );

  for (const page of pages) {
    page.depth = calculateDepth(page, nodesById);
  }

  const roots: NotionPageNode[] = [];

  for (const page of pages) {
    if (!page.parentPageId) {
      roots.push(page);
      continue;
    }

    const parent = nodesById.get(page.parentPageId);

    if (!parent) {
      /*
       * A página-pai pode não estar compartilhada com a integração
       * ou não ter aparecido na busca. Nesse caso, a página vira uma
       * raiz local, sem quebrar a sincronização.
       */
      roots.push(page);
      continue;
    }

    parent.children.push(page);
  }

  const sortNodes = (nodes: NotionPageNode[]): void => {
    nodes.sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR", {
        sensitivity: "base",
      }),
    );

    for (const node of nodes) {
      sortNodes(node.children);
    }
  };

  sortNodes(roots);

  return {
    pages,
    roots,
  };
}