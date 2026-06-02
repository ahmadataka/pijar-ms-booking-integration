import http from "node:http";
import { config, hasMicrosoftCredentials, hasOdooCredentials } from "./config.js";
import { loadLastProductionSyncResult, runProductionSync } from "./productionSync.js";

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function handleRequest(req, res) {
  if (req.url === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "pijar-ms-booking-integration",
      microsoftConfigured: hasMicrosoftCredentials(),
      odooConfigured: hasOdooCredentials()
    });
  }

  if (req.url === "/config-check") {
    return sendJson(res, 200, {
      ok: true,
      port: config.port,
      buildingName: config.microsoft.buildingName,
      roomListConfigured: Boolean(config.microsoft.roomListEmail),
      microsoftConfigured: hasMicrosoftCredentials(),
      odooConfigured: hasOdooCredentials(),
      syncLookbackDays: config.sync.lookbackDays,
      syncLookaheadDays: config.sync.lookaheadDays
    });
  }

  if (req.url === "/sync/last-run") {
    const lastRun = await loadLastProductionSyncResult();
    return sendJson(res, 200, {
      ok: true,
      lastRun
    });
  }

  if (req.url?.startsWith("/sync/run")) {
    const url = new URL(req.url, "http://127.0.0.1");
    const execute = url.searchParams.get("execute") === "1";
    const includeUnmapped = url.searchParams.get("includeUnmapped") === "1";
    const result = await runProductionSync({
      execute,
      includeUnmapped
    });
    return sendJson(res, 200, {
      ok: true,
      ...result
    });
  }

  return sendJson(res, 404, {
    ok: false,
    error: "Not found"
  });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendJson(res, 500, {
      ok: false,
      error: error.message
    });
  });
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(
    `[pijar-ms-booking-integration] listening on http://127.0.0.1:${config.port}`
  );
});
