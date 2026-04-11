#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import {
  getAccessToken,
  getEmailFromEnv,
  getOAuthAuthorizationUrl,
  exchangeCodeForEmail,
  signUserJwt,
  verifyUserJwt,
} from "./auth.js";
import { runSetupIfNeeded } from "./setup.js";
import { registerCalendarTool } from "./tools/calendar.js";
import { registerMailTool } from "./tools/mail.js";

async function loadEnv(): Promise<void> {
  try {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = resolve(__dirname, "../.env");
    const env = readFileSync(envPath, "utf8");
    for (const line of env.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found — rely on environment variables set externally
  }
}

function createMcpServer(email: string): McpServer {
  const serviceUrl = process.env.SERVICE_URL ?? "";
  const server = new McpServer(
    { name: "inovia-m365", version: "1.0.0" },
    {
      instructions:
        `Tools for inovia.sk Microsoft 365 workspace — calendar and inbox for ${email}. ` +
        "Use get_today_events to fetch calendar events, get_new_messages to fetch unread emails. " +
        `If tools stop working, the session token may have expired — visit ${serviceUrl}/auth/login to renew.`,
    }
  );
  registerCalendarTool(server, email);
  registerMailTool(server, email);
  return server;
}

// Served when no token is present — guides the user through authentication
function createOnboardingServer(): McpServer {
  const serviceUrl = process.env.SERVICE_URL ?? "";
  const loginUrl = `${serviceUrl}/auth/login`;

  const server = new McpServer(
    { name: "inovia-m365", version: "1.0.0" },
    {
      instructions:
        "The user has not yet authenticated their Microsoft 365 account. " +
        `Tell them to visit ${loginUrl} in their browser, sign in with their @inovia.sk account, ` +
        "and update their MCP server URL with the personal URL shown on the page. " +
        "They can also call the 'authenticate' tool to get the login link.",
    }
  );

  server.tool(
    "authenticate",
    "Get the link to connect your @inovia.sk Microsoft 365 account.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            action: "authentication_required",
            login_url: loginUrl,
            instructions:
              `1. Open ${loginUrl} in your browser\n` +
              "2. Sign in with your @inovia.sk Microsoft account\n" +
              "3. Copy the personal MCP URL shown on the page\n" +
              "4. In Claude Code: run `claude mcp add inovia-m365 --transport http <your-personal-url>`\n" +
              "   In Cowork: go to Settings → MCP servers and replace the current URL",
          }),
        },
      ],
    })
  );

  return server;
}

function authCallbackHtml(email: string, personalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>inovia M365 — Prihlásenie úspešné</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 640px; margin: 60px auto; padding: 0 24px; color: #1a1a1a; }
    h1 { font-size: 1.4rem; margin-bottom: 4px; }
    .email { color: #0078d4; margin-bottom: 32px; }
    h2 { font-size: 1rem; margin-bottom: 8px; }
    .url-box { background: #f4f4f4; border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-bottom: 8px; }
    button { background: #0078d4; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 0.9rem; cursor: pointer; }
    button:hover { background: #005ea2; }
    .steps { margin-top: 32px; padding-left: 20px; line-height: 1.8; color: #444; }
    .note { margin-top: 24px; font-size: 0.85rem; color: #666; }
  </style>
</head>
<body>
  <h1>Prihlásenie úspešné</h1>
  <div class="email">${email}</div>

  <h2>Tvoja osobná URL adresa MCP servera:</h2>
  <div class="url-box" id="url">${personalUrl}</div>
  <button onclick="navigator.clipboard.writeText(document.getElementById('url').textContent).then(()=>this.textContent='Skopírované ✓')">Kopírovať</button>

  <h2 style="margin-top:32px">Ako začať</h2>
  <ol class="steps">
    <li>Stiahni <a href="https://github.com/stuposk/inovia-m365-mcp/releases/latest/download/inovia-m365.plugin"><strong>inovia-m365.plugin</strong></a></li>
    <li>V Claude Cowork klikni <strong>Customize → Browse plugins → Upload plugin</strong> a vyber súbor</li>
    <li>Vlož URL vyššie: <strong>Nastavenia → MCP servery</strong></li>
    <li>Napíš <strong>/daily-briefing</strong> a Claude zobrazí prehľad dňa</li>
  </ol>

  <p class="note">URL je platná 30 dní. Po vypršaní sa vráť na <a href="/auth/login">prihlásenie</a>.</p>
</body>
</html>`;
}

async function startHttp(port: number): Promise<void> {
  const httpServer = createServer(async (req, res) => {
    const base = `http://localhost`;
    const url = new URL(req.url ?? "/", base);
    const pathname = url.pathname;

    // GET / → redirect to login
    if (req.method === "GET" && pathname === "/") {
      res.writeHead(302, { Location: "/auth/login" });
      res.end();
      return;
    }

    // GET /auth/login → redirect to Microsoft OAuth
    if (req.method === "GET" && pathname === "/auth/login") {
      try {
        const authUrl = getOAuthAuthorizationUrl();
        res.writeHead(302, { Location: authUrl });
        res.end();
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Configuration error: ${err.message}`);
      }
      return;
    }

    // GET /auth/callback → exchange code, issue JWT, show personal URL
    if (req.method === "GET" && pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error || !code) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`OAuth chyba: ${error ?? "chýba kód"}`);
        return;
      }

      try {
        const email = await exchangeCodeForEmail(code);
        const jwt = await signUserJwt(email);
        const serviceUrl = process.env.SERVICE_URL ?? `http://localhost:${port}`;
        const personalUrl = `${serviceUrl}/mcp?token=${jwt}`;

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(authCallbackHtml(email, personalUrl));
      } catch (err: any) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Prihlásenie zlyhalo: ${err.message}`);
      }
      return;
    }

    // ANY /mcp → MCP handler (with or without token)
    if (pathname === "/mcp") {
      const token = url.searchParams.get("token");

      let mcpServer: McpServer;

      if (!token) {
        // No token — serve onboarding server so Claude can guide the user
        mcpServer = createOnboardingServer();
      } else {
        // Validate token
        let email: string;
        try {
          ({ email } = await verifyUserJwt(token));
        } catch {
          // Expired or invalid — serve onboarding server with renewal message
          mcpServer = createOnboardingServer();
          const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
          res.on("close", () => { transport.close(); });
          await mcpServer.connect(transport);
          await transport.handleRequest(req, res);
          return;
        }

        // Validate Graph credentials (fast — MSAL caches the token)
        try {
          await getAccessToken();
        } catch (err: any) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Graph auth failed: ${err.message}` }));
          return;
        }

        mcpServer = createMcpServer(email);
      }

      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => { transport.close(); });

      try {
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
      } catch (err: any) {
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  });

  httpServer.listen(port, "0.0.0.0", () => {
    process.stderr.write(`[inovia-m365-mcp] HTTP server listening on 0.0.0.0:${port}\n`);
  });
}

async function startStdio(): Promise<void> {
  await runSetupIfNeeded();
  try {
    await getAccessToken();
  } catch (err: any) {
    process.stderr.write(`\n[inovia-m365-mcp] Authentication error: ${err.message}\n`);
    process.exit(1);
  }
  const email = getEmailFromEnv();
  const server = createMcpServer(email);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function main(): Promise<void> {
  await loadEnv();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  if (port) {
    await startHttp(port);
  } else {
    await startStdio();
  }
}

main().catch((err) => {
  process.stderr.write(`[inovia-m365-mcp] Fatal error: ${err.message}\n`);
  process.exit(1);
});
