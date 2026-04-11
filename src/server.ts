#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { getAccessToken } from "./auth.js";
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

function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "inovia-m365", version: "1.0.0" },
    {
      instructions:
        "Tools for inovia.sk Microsoft 365 workspace. " +
        "Use get_today_events to fetch today's calendar, " +
        "and get_new_messages to fetch unread inbox emails. " +
        "Both require the user to be authenticated with their @inovia.sk Microsoft account.",
    }
  );
  registerCalendarTool(server);
  registerMailTool(server);
  return server;
}

async function startHttp(port: number): Promise<void> {
  // Stateless transport: each POST to /mcp is a self-contained MCP exchange.
  // This matches Cloud Run's stateless request model.
  const httpServer = createServer(async (req, res) => {
    if (req.url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }

    // Validate auth per-request so the container starts even before env vars are configured
    try {
      await getAccessToken();
    } catch (err: any) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Authentication failed: ${err.message}` }));
      return;
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createMcpServer();

    res.on("close", () => { transport.close(); });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
  });

  // Listen first — Cloud Run requires the port to be bound quickly at startup
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
  const server = createMcpServer();
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
