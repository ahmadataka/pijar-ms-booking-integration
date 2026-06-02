import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { runMappedRoomsSync } from "./mappedRoomsSync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const lockFile = path.join(dataDir, "production-sync.lock");
const lastRunFile = path.join(dataDir, "last-production-sync.json");

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoStringLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}Z`;
}

export function buildProductionSyncWindow(now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - config.sync.lookbackDays);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + config.sync.lookaheadDays);
  end.setUTCHours(23, 59, 59, 999);

  return {
    startIso: toIsoStringLocal(start),
    endIso: toIsoStringLocal(end)
  };
}

async function acquireLock() {
  await mkdir(dataDir, { recursive: true });
  const handle = await open(lockFile, "wx");
  await handle.writeFile(`${process.pid}\n`, "utf8");
  return handle;
}

async function releaseLock(handle) {
  try {
    await handle.close();
  } finally {
    await rm(lockFile, { force: true });
  }
}

export async function loadLastProductionSyncResult() {
  try {
    const raw = await readFile(lastRunFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function saveLastProductionSyncResult(result) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(lastRunFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

export async function runProductionSync({
  execute = false,
  includeUnmapped = false,
  now = new Date()
} = {}) {
  const lockHandle = await acquireLock();

  try {
    const window = buildProductionSyncWindow(now);
    const syncResult = await runMappedRoomsSync({
      ...window,
      execute,
      includeUnmapped
    });

    const result = {
      mode: execute ? "execute" : "dry-run",
      ranAt: new Date().toISOString(),
      lookbackDays: config.sync.lookbackDays,
      lookaheadDays: config.sync.lookaheadDays,
      includeUnmapped,
      ...syncResult
    };

    await saveLastProductionSyncResult(result);
    return result;
  } finally {
    await releaseLock(lockHandle);
  }
}
