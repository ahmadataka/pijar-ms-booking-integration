import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const stateFile = path.join(dataDir, "sync-state.json");

function defaultState() {
  return {
    bookings: []
  };
}

export async function loadSyncState() {
  try {
    const raw = await readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.bookings)) {
      return defaultState();
    }
    return parsed;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return defaultState();
    }
    throw error;
  }
}

export async function saveSyncState(state) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function indexSyncStateByMicrosoftEventId(state) {
  const index = new Map();
  for (const booking of state.bookings || []) {
    if (booking.microsoftEventId) {
      index.set(booking.microsoftEventId, booking);
    }
  }
  return index;
}

export function upsertSyncStateBooking(state, entry) {
  const items = Array.isArray(state.bookings) ? state.bookings : [];
  const index = items.findIndex((item) => item.microsoftEventId === entry.microsoftEventId);
  if (index >= 0) {
    items[index] = entry;
  } else {
    items.push(entry);
  }
  state.bookings = items;
  return state;
}

export function removeSyncStateBooking(state, microsoftEventId) {
  state.bookings = (state.bookings || []).filter(
    (item) => item.microsoftEventId !== microsoftEventId
  );
  return state;
}
