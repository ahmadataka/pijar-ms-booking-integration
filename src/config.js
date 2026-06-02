import fs from "node:fs";
import path from "node:path";

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

export const config = {
  port: Number(process.env.PORT || 8787),
  logLevel: process.env.LOG_LEVEL || "debug",
  microsoft: {
    tenantId: process.env.MS_TENANT_ID || "",
    clientId: process.env.MS_CLIENT_ID || "",
    clientSecret: process.env.MS_CLIENT_SECRET || "",
    roomListEmail: process.env.MS_ROOM_LIST_EMAIL || "",
    buildingName: process.env.MS_BUILDING_NAME || "Pijar Foundation HQ",
    timeZone: process.env.MS_TIME_ZONE || "SE Asia Standard Time"
  },
  odoo: {
    baseUrl: process.env.ODOO_BASE_URL || "",
    database: process.env.ODOO_DATABASE || "",
    login: process.env.ODOO_LOGIN || "",
    password: process.env.ODOO_PASSWORD || ""
  },
  sync: {
    lookbackDays: Number(process.env.SYNC_LOOKBACK_DAYS || 1),
    lookaheadDays: Number(process.env.SYNC_LOOKAHEAD_DAYS || 2)
  }
};

export function hasMicrosoftCredentials() {
  return Boolean(
    config.microsoft.tenantId &&
      config.microsoft.clientId &&
      config.microsoft.clientSecret
  );
}

export function hasOdooCredentials() {
  return Boolean(
    config.odoo.baseUrl &&
      config.odoo.database &&
      config.odoo.login &&
      config.odoo.password
  );
}
