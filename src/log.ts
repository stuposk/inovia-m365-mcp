// Structured logging + in-memory usage stats.
// - Structured logs go to stdout → Cloud Logging parses into jsonPayload (persistent, historical)
// - In-memory stats power the /admin dashboard (resets on cold start, but real-time)

export interface UserStats {
  email: string;
  calls: number;                       // HTTP /mcp requests (sessions)
  toolCounts: Record<string, number>;  // per-tool invocation counts
  firstSeen: string;
  lastSeen: string;
}

const usageStats = new Map<string, UserStats>();
const serverStartedAt = new Date().toISOString();

function nowIso(): string {
  return new Date().toISOString();
}

function getOrCreate(email: string): UserStats {
  let s = usageStats.get(email);
  if (!s) {
    s = { email, calls: 0, toolCounts: {}, firstSeen: nowIso(), lastSeen: nowIso() };
    usageStats.set(email, s);
  }
  return s;
}

export function trackUsage(email: string): void {
  const s = getOrCreate(email);
  s.calls++;
  s.lastSeen = nowIso();
}

export function logToolCall(email: string, tool: string): void {
  console.log(JSON.stringify({
    type: "tool_call",
    email,
    tool,
    ts: nowIso(),
  }));
  const s = getOrCreate(email);
  s.toolCounts[tool] = (s.toolCounts[tool] ?? 0) + 1;
  s.lastSeen = nowIso();
}

export function getUsageStats(): UserStats[] {
  return Array.from(usageStats.values());
}

export function getServerStartedAt(): string {
  return serverStartedAt;
}
