import { Client } from "@microsoft/microsoft-graph-client";
import "node-fetch";
import { getAccessToken, getUserEmail } from "./auth.js";

let _client: Client | null = null;

export function getGraphClient(): Client {
  if (_client) return _client;

  _client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => getAccessToken(),
    },
  });

  return _client;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  organizer: string;
  location: string;
  isOnlineMeeting: boolean;
  onlineMeetingUrl: string | null;
  isAllDay: boolean;
}

export interface MailMessage {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  receivedAt: string;
  preview: string;
  isRead: boolean;
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const client = getGraphClient();
  const userEmail = getUserEmail();

  const tz = "Europe/Bratislava";
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = formatter.format(now);
  const startDateTime = `${todayStr}T00:00:00`;
  const endDateTime = `${todayStr}T23:59:59`;

  const response = await client
    .api(`/users/${userEmail}/calendarView`)
    .header("Prefer", `outlook.timezone="${tz}"`)
    .query({
      startDateTime,
      endDateTime,
      $select:
        "id,subject,start,end,organizer,location,isOnlineMeeting,onlineMeetingUrl,isAllDay",
      $orderby: "start/dateTime asc",
      $top: 50,
    })
    .get();

  const events: CalendarEvent[] = (response.value ?? []).map((e: any) => ({
    id: e.id,
    subject: e.subject ?? "(bez názvu)",
    start: e.start?.dateTime ?? "",
    end: e.end?.dateTime ?? "",
    organizer: e.organizer?.emailAddress?.name ?? "",
    location: e.location?.displayName ?? "",
    isOnlineMeeting: !!e.isOnlineMeeting,
    onlineMeetingUrl: e.onlineMeetingUrl ?? null,
    isAllDay: !!e.isAllDay,
  }));

  return events;
}

export async function getNewMessages(limit: number): Promise<MailMessage[]> {
  const client = getGraphClient();
  const userEmail = getUserEmail();

  const response = await client
    .api(`/users/${userEmail}/mailFolders/inbox/messages`)
    .query({
      $filter: "isRead eq false",
      $orderby: "receivedDateTime desc",
      $top: limit,
      $select: "id,subject,from,receivedDateTime,bodyPreview,isRead",
    })
    .get();

  const messages: MailMessage[] = (response.value ?? []).map((m: any) => ({
    id: m.id,
    subject: m.subject ?? "(bez predmetu)",
    from: m.from?.emailAddress?.name ?? "",
    fromEmail: m.from?.emailAddress?.address ?? "",
    receivedAt: m.receivedDateTime ?? "",
    preview: (m.bodyPreview ?? "").slice(0, 300),
    isRead: !!m.isRead,
  }));

  return messages;
}
