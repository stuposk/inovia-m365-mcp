import { Client } from "@microsoft/microsoft-graph-client";
import "node-fetch";
import { getAccessToken } from "./auth.js";

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

export async function getEvents(email: string, from?: string, to?: string): Promise<CalendarEvent[]> {
  const client = getGraphClient();
  const userEmail = email;

  const tz = "Europe/Bratislava";
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = formatter.format(new Date());
  const startDateTime = `${from ?? todayStr}T00:00:00`;
  const endDateTime = `${to ?? todayStr}T23:59:59`;

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

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  businessPhone: string | null;
}

const USER_SELECT = "id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones";

function mapUser(u: any): UserProfile {
  return {
    id: u.id,
    displayName: u.displayName ?? "",
    email: u.mail ?? u.userPrincipalName ?? "",
    jobTitle: u.jobTitle ?? null,
    department: u.department ?? null,
    officeLocation: u.officeLocation ?? null,
    mobilePhone: u.mobilePhone ?? null,
    businessPhone: (u.businessPhones ?? [])[0] ?? null,
  };
}

export async function findUsers(query: string): Promise<UserProfile[]> {
  const client = getGraphClient();
  const response = await client
    .api("/users")
    .query({
      $search: `"displayName:${query}" OR "mail:${query}" OR "department:${query}"`,
      $select: USER_SELECT,
      $top: 15,
    })
    .header("ConsistencyLevel", "eventual")
    .get();
  return (response.value ?? []).map(mapUser);
}

export async function getUsersByDepartment(department: string): Promise<UserProfile[]> {
  const client = getGraphClient();
  const response = await client
    .api("/users")
    .query({
      $filter: `department eq '${department.replace(/'/g, "''")}'`,
      $select: USER_SELECT,
      $top: 50,
    })
    .get();
  return (response.value ?? []).map(mapUser);
}

export async function getUserOrgChart(userEmail: string): Promise<{
  user: UserProfile;
  manager: UserProfile | null;
  directReports: UserProfile[];
}> {
  const client = getGraphClient();

  const [userRes, managerRes, reportsRes] = await Promise.allSettled([
    client.api(`/users/${userEmail}`).query({ $select: USER_SELECT }).get(),
    client.api(`/users/${userEmail}/manager`).query({ $select: USER_SELECT }).get(),
    client.api(`/users/${userEmail}/directReports`).query({ $select: USER_SELECT }).get(),
  ]);

  const user = userRes.status === "fulfilled" ? mapUser(userRes.value) : null;
  if (!user) throw new Error(`Používateľ nenájdený: ${userEmail}`);

  const manager = managerRes.status === "fulfilled" ? mapUser(managerRes.value) : null;
  const directReports = reportsRes.status === "fulfilled"
    ? (reportsRes.value.value ?? []).map(mapUser)
    : [];

  return { user, manager, directReports };
}

export async function getNewMessages(email: string, limit: number): Promise<MailMessage[]> {
  const client = getGraphClient();
  const userEmail = email;

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
