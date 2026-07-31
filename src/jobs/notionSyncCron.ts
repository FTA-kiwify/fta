import { syncNotionProcesses } from "../services/notion/sync";

export async function runNotionSyncCron() {
  console.log("[Notion] Iniciando sincronização...");
  await syncNotionProcesses();
  console.log("[Notion] Sincronização concluída.");
}