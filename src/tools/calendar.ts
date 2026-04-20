import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getEvents } from "../graph.js";
import { logToolCall } from "../log.js";

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
      logToolCall(email, "get_today_events");
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

// Graph API returns dateTime already in Europe/Bratislava (via Prefer header).
// Parse HH:MM directly from the string — do NOT use new Date() which would
// re-interpret the offset-less string as UTC.

function formatDateTime(localDateTime: string, includeDate: boolean): string {
  if (!localDateTime) return "";
  if (includeDate) {
    // localDateTime is e.g. "2026-04-13T08:30:00"
    const [datePart] = localDateTime.split("T");
    const date = new Date(datePart + "T12:00:00Z"); // noon UTC to avoid day shift
    const weekday = date.toLocaleDateString("sk-SK", { weekday: "short", timeZone: "UTC" });
    const day = date.toLocaleDateString("sk-SK", { day: "numeric", month: "numeric", timeZone: "UTC" });
    return `${weekday} ${day} ${formatTime(localDateTime)}`;
  }
  return formatTime(localDateTime);
}

function formatTime(localDateTime: string): string {
  if (!localDateTime) return "";
  const timePart = localDateTime.split("T")[1];
  if (!timePart) return "";
  const [h, m] = timePart.split(":");
  return `${h}:${m}`;
}
