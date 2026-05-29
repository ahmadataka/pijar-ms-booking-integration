import { getMicrosoftAccessToken } from "./graphAuth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function graphGet(path) {
  const token = await getMicrosoftAccessToken();

  const response = await fetch(`${GRAPH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph GET ${path} failed (${response.status}): ${text}`);
  }

  return response.json();
}
