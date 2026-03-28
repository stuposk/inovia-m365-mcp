#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getAccessToken } from "./auth.js";
import { registerCalendarTool } from "./tools/calendar.js";
import { registerMailTool } from "./tools/mail.js";

async function main(): Promise<void> {
  // Load .env if present (for local development)
  const envPath = new URL("../../.env", import.meta.url).pathname;
  try {
    const { readFileSync } = await import("fs");
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

  // Eagerly authenticate before connecting so auth errors surface immediately
  // and the device-code prompt appears before MCP handshake
  try {
    await getAccessToken();
  } catch (err: any) {
    process.stderr.write(`\n[inovia-m365-mcp] Authentication error: ${err.message}\n`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[inovia-m365-mcp] Fatal error: ${err.message}\n`);
  process.exit(1);
});
