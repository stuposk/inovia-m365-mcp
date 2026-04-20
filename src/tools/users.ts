import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findUsers, getUsersByDepartment, getUserOrgChart } from "../graph.js";
import { logToolCall } from "../log.js";

export function registerUserTools(server: McpServer, email: string): void {
  server.tool(
    "find_colleague",
    "Search for colleagues in the inovia.sk directory by name, email, or department. " +
      "Returns display name, email, job title, department, phone, and office location.",
    {
      query: z.string().describe("Name, email, or department to search for"),
    },
    async ({ query }) => {
      logToolCall(email, "find_colleague");
      const users = await findUsers(query);

      if (users.length === 0) {
        return {
          content: [{ type: "text", text: JSON.stringify({ results: [], message: "Žiadni kolegovia nenájdení." }) }],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ results: users, count: users.length }) }],
      };
    }
  );

  server.tool(
    "get_department_members",
    "List all members of a specific department in the inovia.sk organization.",
    {
      department: z.string().describe("Exact department name (e.g. 'Marketing', 'IT', 'Finance')"),
    },
    async ({ department }) => {
      logToolCall(email, "get_department_members");
      const users = await getUsersByDepartment(department);

      if (users.length === 0) {
        return {
          content: [{ type: "text", text: JSON.stringify({ results: [], message: `Žiadni členovia v oddelení: ${department}` }) }],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ department, results: users, count: users.length }) }],
      };
    }
  );

  server.tool(
    "get_org_chart",
    "Show the organizational hierarchy for a colleague — their manager and direct reports. " +
      "Pass their email address to look them up.",
    {
      email: z.string().email().describe("Email address of the colleague (e.g. jan.novak@inovia.sk)"),
    },
    async ({ email: target }) => {
      logToolCall(email, "get_org_chart");
      const { user, manager, directReports } = await getUserOrgChart(target);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            user,
            manager: manager ?? null,
            directReports,
            directReportCount: directReports.length,
          }),
        }],
      };
    }
  );
}
