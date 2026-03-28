import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getTodayEvents } from "../graph.js";

export function registerCalendarTool(server: McpServer): void {
  server.tool(
    "get_today_events",
    "Returns the signed-in user's calendar events for today (Europe/Bratislava timezone). " +
      "Includes start/end time, subject, organizer, location, and online meeting URL if present. " +
      "Call this to build a morning briefing.",
    {},
    async () => {
      const events = await getTodayEvents();

      if (events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ events: [], message: "Dnes žiadne udalosti v kalendári." }),
            },
          ],
        };
      }

      const formatted = events.map((e) => {
        const start = e.isAllDay
          ? "celý deň"
          : formatTime(e.start);
        const end = e.isAllDay ? "" : ` – ${formatTime(e.end)}`;
        return {
          čas: `${start}${end}`,
          predmet: e.subject,
          organizátor: e.organizer,
          miesto: e.location || null,
          online: e.isOnlineMeeting ? e.onlineMeetingUrl : null,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ events: formatted, count: events.length }),
          },
        ],
      };
    }
  );
}

function formatTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("sk-SK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bratislava",
  });
}
