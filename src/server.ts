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
import { registerUserTools } from "./tools/users.js";
import { registerMarketingTool } from "./tools/marketing.js";
import { registerCapabilitiesTool } from "./tools/capabilities.js";

const VERSION = "26.04.03";
const REPO_URL = "https://github.com/stuposk/inovia-m365-mcp";

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
    { name: "inovia-m365", version: "26.04.01" },
    {
      instructions:
        `Tools for inovia.sk Microsoft 365 workspace — calendar, inbox, and company directory for ${email}. ` +
        "Use get_today_events to fetch calendar events, get_new_messages to fetch unread emails, " +
        "find_colleague to search the company directory, get_department_members to list a team, " +
        "get_org_chart to show manager and direct reports for any colleague. " +
        `If tools stop working, the session token may have expired — visit ${serviceUrl}/auth/login to renew.`,
    }
  );
  registerCapabilitiesTool(server);
  registerCalendarTool(server, email);
  registerMailTool(server, email);
  registerUserTools(server);
  registerMarketingTool(server);
  return server;
}

// Served when no token is present — guides the user through authentication
function createOnboardingServer(): McpServer {
  const serviceUrl = process.env.SERVICE_URL ?? "";
  const loginUrl = `${serviceUrl}/auth/login`;

  const server = new McpServer(
    { name: "inovia-m365", version: "26.04.01" },
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
              "   In Cowork: Personal plugins → Inovia → Connectors → inovia-m365 → update the URL",
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
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f0f4f8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      color: #1a1a2e;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 10px 40px rgba(0,0,0,0.08);
      padding: 40px 44px;
      width: 100%;
      max-width: 620px;
    }
    .success-header { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
    .success-icon { flex-shrink: 0; width: 40px; height: 40px; }
    .success-title { font-size: 1.55rem; font-weight: 700; color: #111827; letter-spacing: -0.3px; }
    .email-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: #eff6ff; border: 1px solid #bfdbfe; color: #0078d4;
      font-size: 0.88rem; font-weight: 500; border-radius: 20px;
      padding: 4px 14px; margin-top: 10px; margin-bottom: 36px;
    }
    .email-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }
    .section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 10px; }
    .url-block {
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
    }
    .url-text {
      font-family: "SF Mono", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 0.82rem; color: #0f172a; word-break: break-all; flex: 1; line-height: 1.5;
    }
    .copy-btn {
      flex-shrink: 0; background: #0078d4; color: #ffffff; border: none; border-radius: 7px;
      padding: 8px 16px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: background 0.15s ease, transform 0.1s ease; font-family: inherit;
    }
    .copy-btn:hover { background: #005ea2; }
    .copy-btn:active { transform: scale(0.97); }
    .divider { border: none; border-top: 1px solid #f1f5f9; margin: 8px 0 28px; }
    .steps-title { font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 20px; }
    .steps { list-style: none; display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
    .step { display: flex; align-items: flex-start; gap: 14px; }
    .step-num {
      flex-shrink: 0; width: 28px; height: 28px; background: #0078d4; color: #ffffff;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 700; margin-top: 1px;
    }
    .step-body { flex: 1; font-size: 0.9rem; line-height: 1.6; color: #374151; }
    .step-body a { color: #0078d4; font-weight: 600; text-decoration: none; }
    .step-body a:hover { text-decoration: underline; }
    .step-body strong { color: #111827; font-weight: 600; }
    .step-body code {
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px;
      padding: 1px 6px; font-family: "SF Mono", Consolas, "Courier New", monospace;
      font-size: 0.82em; color: #0f172a;
    }
    .note-box {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
      padding: 12px 14px; font-size: 0.84rem; color: #78350f; line-height: 1.5;
    }
    .note-box svg { flex-shrink: 0; margin-top: 1px; }
    .note-box a { color: #92400e; font-weight: 600; }
    .note-box a:hover { text-decoration: underline; }
    footer { margin-top: 24px; text-align: center; font-size: 0.78rem; color: #9ca3af; line-height: 1.8; }
    footer a { color: #9ca3af; text-decoration: none; }
    footer a:hover { color: #6b7280; text-decoration: underline; }
    @media (max-width: 520px) {
      .card { padding: 28px 22px; }
      .success-title { font-size: 1.3rem; }
      .url-block { flex-direction: column; align-items: stretch; }
      .copy-btn { width: 100%; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="success-header">
      <svg class="success-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="#dcfce7"/>
        <circle cx="20" cy="20" r="14" fill="#22c55e"/>
        <path d="M13.5 20.5L17.5 24.5L26.5 15.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h1 class="success-title">Prihlásenie úspešné</h1>
    </div>

    <div class="email-badge">
      <span class="email-dot"></span>
      ${email}
    </div>

    <p class="section-label">Tvoja osobná URL adresa MCP servera</p>
    <div class="url-block">
      <span class="url-text" id="url">${personalUrl}</span>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('url').textContent).then(()=>this.textContent='Skopírované ✓')">Kopírovať</button>
    </div>

    <hr class="divider">

    <p class="steps-title">Ako nastaviť connector</p>
    <ol class="steps">
      <li class="step">
        <span class="step-num">1</span>
        <span class="step-body">Ak ešte nemáš plugin: stiahni <a href="https://github.com/stuposk/inovia-m365-mcp/releases/latest/download/inovia.zip"><strong>inovia.zip</strong></a> a nainštaluj cez <strong>Customize → Browse plugins → Upload plugin</strong></span>
      </li>
      <li class="step">
        <span class="step-num">2</span>
        <span class="step-body">V Cowork klikni <strong>Customize → Add custom connector</strong></span>
      </li>
      <li class="step">
        <span class="step-num">3</span>
        <span class="step-body">Zadaj názov <code>inovia-m365</code> a URL skopírovanú vyššie → klikni <strong>Add</strong></span>
      </li>
      <li class="step">
        <span class="step-num">4</span>
        <span class="step-body">Napíš <strong>ranný prehľad</strong> a Claude zobrazí prehľad dňa</span>
      </li>
    </ol>

    <div class="note-box">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="8" cy="8" r="7.25" stroke="#f59e0b" stroke-width="1.5"/>
        <path d="M8 4.5V8.5" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="11" r="0.75" fill="#f59e0b"/>
      </svg>
      <span>URL je platná 30 dní. Po vypršaní sa vráť na <a href="/auth/login">prihlásenie</a>.</span>
    </div>
  </div>

  <footer>
    v${VERSION} &middot; <a href="${REPO_URL}" target="_blank" rel="noopener">github.com/stuposk/inovia-m365-mcp</a><br>
    Powered by <a href="https://unite.sk" target="_blank" rel="noopener">Unite</a>
  </footer>
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
