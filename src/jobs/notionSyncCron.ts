import { syncNotionProcesses } from "../services/notion/sync";

export async function runNotionSyncCron() {
  await syncNotionProcesses();
}