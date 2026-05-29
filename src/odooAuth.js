import { config, hasOdooCredentials } from "./config.js";

let cachedToken = null;
let cachedExpiry = null;

function buildUrl(path) {
  const base = config.odoo.baseUrl.replace(/\/+$/, "");
  return `${base}${path}`;
}

function isTokenUsable() {
  if (!cachedToken || !cachedExpiry) return false;
  return Date.now() < cachedExpiry - 60_000;
}

function parseExpiry(expiresAt) {
  if (!expiresAt) return Date.now() + 55 * 60_000;
  const isoGuess = expiresAt.includes("T") ? expiresAt : expiresAt.replace(" ", "T");
  const parsed = new Date(isoGuess).getTime();
  if (Number.isNaN(parsed)) return Date.now() + 55 * 60_000;
  return parsed;
}

export async function getOdooAccessToken() {
  if (!hasOdooCredentials()) {
    throw new Error("Missing Odoo credentials. Fill ODOO_BASE_URL, ODOO_DATABASE, ODOO_LOGIN, and ODOO_PASSWORD in .env");
  }

  if (isTokenUsable()) {
    return cachedToken;
  }

  const response = await fetch(buildUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      login: config.odoo.login,
      password: config.odoo.password,
      db: config.odoo.database
    })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.success || !json?.data?.token) {
    throw new Error(`Odoo login failed: ${json?.message || response.statusText}`);
  }

  cachedToken = json.data.token;
  cachedExpiry = parseExpiry(json.data.expires_at);
  return cachedToken;
}
