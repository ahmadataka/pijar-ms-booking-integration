import { config, hasMicrosoftCredentials } from "./config.js";

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

export async function getMicrosoftAccessToken() {
  if (!hasMicrosoftCredentials()) {
    throw new Error("Microsoft credentials are not fully configured in .env");
  }

  const tokenUrl = `https://login.microsoftonline.com/${config.microsoft.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: config.microsoft.clientId,
    client_secret: config.microsoft.clientSecret,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  if (!json.access_token) {
    throw new Error("Token response did not contain access_token");
  }

  return json.access_token;
}
