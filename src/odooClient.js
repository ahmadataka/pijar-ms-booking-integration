import { config } from "./config.js";
import { getOdooAccessToken } from "./odooAuth.js";

function buildUrl(path) {
  const base = config.odoo.baseUrl.replace(/\/+$/, "");
  return `${base}${path}`;
}

export async function odooGet(path, params = {}) {
  const token = await getOdooAccessToken();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(buildUrl(`${path}${suffix}`), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.success) {
    throw new Error(`Odoo GET ${path} failed: ${json?.message || response.statusText}`);
  }

  return json.data;
}
