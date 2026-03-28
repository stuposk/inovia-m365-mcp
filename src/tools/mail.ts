import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getNewMessages } from "../graph.js";

export function registerMailTool(server: McpServer): void {
  server.tool(
    "get_new_messages",
    "Returns unread emails in the signed-in user's inbox, newest first. " +
      "Returns sender name, sender email, subject, received time, and a short body preview. " +
      "Use limit to control how many messages to fetch (default 15, max 50).",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(15)
        .describe("Number of unread messages to fetch (1–50)"),
    },
    async ({ limit }) => {
      const messages = await getNewMessages(limit);

      if (messages.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ messages: [], message: "Žiadne neprečítané správy v doručenej pošte." }),
            },
          ],
        };
      }

      const formatted = messages.map((m) => ({
        od: m.from ? `${m.from} <${m.fromEmail}>` : m.fromEmail,
        predmet: m.subject,
        prijatá: formatReceived(m.receivedAt),
        náhľad: m.preview,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ messages: formatted, count: messages.length }),
          },
        ],
      };
    }
  );
}

function formatReceived(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("sk-SK", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Bratislava",
    });
  }

  return date.toLocaleDateString("sk-SK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bratislava",
  });
}
