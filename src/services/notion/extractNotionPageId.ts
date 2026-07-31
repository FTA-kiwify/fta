export function extractNotionPageId(
  notionUrl: string
): string {

  const decodedUrl = decodeURIComponent(
    notionUrl.trim()
  );

  // Aceita IDs que já estejam com hífens.
  const dashedIds = decodedUrl.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
  );

  if (dashedIds?.length) {
    return dashedIds[dashedIds.length - 1].toLowerCase();
  }

  // Aceita IDs compactos de 32 caracteres,
  // independentemente do domínio, slug ou query string.
  const compactIds = decodedUrl.match(
    /[0-9a-f]{32}/gi
  );

  if (!compactIds?.length) {
    throw new Error(
      `Não foi possível extrair o ID da página do Notion da URL: ${notionUrl}`
    );
  }

  const id =
    compactIds[compactIds.length - 1].toLowerCase();

  return [
    id.slice(0, 8),
    id.slice(8, 12),
    id.slice(12, 16),
    id.slice(16, 20),
    id.slice(20, 32),
  ].join("-");
}