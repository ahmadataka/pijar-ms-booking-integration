import { getMicrosoftAccessToken } from "./graphAuth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function graphGet(path, options = {}) {
  const token = await getMicrosoftAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph GET ${path} failed (${response.status}): ${text}`);
  }

  return response.json();
}
