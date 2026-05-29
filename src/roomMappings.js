import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultMappingFile = path.resolve(__dirname, "../room-mappings.example.json");

export async function loadRoomMappings(filePath = defaultMappingFile) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const rooms = Array.isArray(parsed.rooms) ? parsed.rooms : [];

  return rooms.map((room) => ({
    microsoftRoomEmail: room.microsoftRoomEmail,
    microsoftDisplayName: room.microsoftDisplayName,
    odooRoomId: room.odooRoomId,
    odooRoomName: room.odooRoomName,
    controllerId: room.controllerId,
    site: room.site,
    floor: room.floor
  }));
}

export function indexRoomMappingsByEmail(mappings) {
  const index = new Map();
  for (const mapping of mappings) {
    const email = (mapping.microsoftRoomEmail || "").toLowerCase();
    if (email) {
      index.set(email, mapping);
    }
  }
  return index;
}
