import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function getSkillContextPath(id: string): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // Sanitize id — only allow alphanumeric and hyphens
  const safeId = id.replace(/[^a-z0-9-]/gi, "");
  return resolve(__dirname, `../../data/skills/${safeId}/guide.md`);
}

export function registerSkillContextTool(server: McpServer): void {
  server.tool(
    "get_skill_context",
    "Returns detailed instructions for a specific capability. Call this after get_capabilities when you need full instructions for executing a capability that has hasContext: true.",
    {
      id: z.string().describe("Capability id (e.g. 'daily-briefing')"),
    },
    async ({ id }) => {
      const path = getSkillContextPath(id);

      if (!existsSync(path)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `No context file found for capability: ${id}` }) }],
        };
      }

      const content = readFileSync(path, "utf8");
      return {
        content: [{ type: "text", text: content }],
      };
    }
  );
}
