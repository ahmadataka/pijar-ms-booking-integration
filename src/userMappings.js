import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultMappingFile = path.resolve(__dirname, "../user-mappings.example.json");

export async function loadUserMappings(filePath = defaultMappingFile) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const users = Array.isArray(parsed.users) ? parsed.users : [];

  return users.map((user) => ({
    microsoftEmail: user.microsoftEmail,
    displayName: user.displayName,
    odooUserId: user.odooUserId,
    odooPartnerId: user.odooPartnerId,
    employeeId: user.employeeId
  }));
}

export function indexUserMappingsByEmail(mappings) {
  const index = new Map();
  for (const mapping of mappings) {
    const email = (mapping.microsoftEmail || "").toLowerCase();
    if (email) {
      index.set(email, mapping);
    }
  }
  return index;
}
