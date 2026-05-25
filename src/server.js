import http from "node:http";
import { config, hasMicrosoftCredentials } from "./config.js";

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "pijar-ms-booking-integration",
      microsoftConfigured: hasMicrosoftCredentials()
    });
  }

  if (req.url === "/config-check") {
    return sendJson(res, 200, {
      ok: true,
      port: config.port,
      buildingName: config.microsoft.buildingName,
      roomListConfigured: Boolean(config.microsoft.roomListEmail),
      microsoftConfigured: hasMicrosoftCredentials()
    });
  }

  return sendJson(res, 404, {
    ok: false,
    error: "Not found"
  });
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(
    `[pijar-ms-booking-integration] listening on http://127.0.0.1:${config.port}`
  );
});
