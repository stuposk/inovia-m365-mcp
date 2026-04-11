import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getEvents } from "../graph.js";

export function registerCalendarTool(server: McpServer, email: string): void {
  server.tool(
    "get_today_events",
    "Returns calendar events for the signed-in user (Europe/Bratislava timezone). " +
      "Optional 'from' and 'to' parameters accept dates in YYYY-MM-DD format. " +
      "If omitted, defaults to today. Use to fetch today, a week, or any custom range. " +
      "Includes start/end time, subject, organizer, location, and online meeting URL if present.",
    {
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date (YYYY-MM-DD), default: today"),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date (YYYY-MM-DD), default: today"),
    },
    async ({ from, to }) => {
      const events = await getEvents(email, from, to);

      if (events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ events: [], count: 0, message: "Žiadne udalosti v zadanom období." }),
            },
          ],
        };
      }

      const formatted = events.map((e) => {
        const start = e.isAllDay ? "celý deň" : formatDateTime(e.start, !!from);
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

function formatDateTime(isoString: string, includeDate: boolean): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (includeDate) {
    return date.toLocaleDateString("sk-SK", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Bratislava",
    });
  }
  return formatTime(isoString);
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
