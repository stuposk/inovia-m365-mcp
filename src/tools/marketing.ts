import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function getGuidePath(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "../../data/marketing/guide.md");
}

export function registerMarketingTool(server: McpServer): void {
  server.tool(
    "get_marketing_guide",
    "Returns the inovia.sk marketing communication guide — tone of voice, messaging, templates, and guidelines for external communication.",
    {},
    async () => {
      const path = getGuidePath();

      if (!existsSync(path)) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: "Marketing guide not found. Place guide.md in data/marketing/." }),
          }],
        };
      }

      const content = readFileSync(path, "utf8");

      // Extract version from first lines (format: **Verzia:** X.X | mesiac rok)
      const versionMatch = content.match(/\*\*Verzia:\*\*\s*(.+)/);
      const version = versionMatch ? versionMatch[1].trim() : null;

      return {
        content: [{ type: "text", text: JSON.stringify({ version, content }) }],
      };
    }
  );
}
