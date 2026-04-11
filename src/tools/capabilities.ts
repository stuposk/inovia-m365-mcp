import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function marketingGuideExists(): boolean {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return existsSync(resolve(__dirname, "../../data/marketing/guide.md"));
}

export function registerCapabilitiesTool(server: McpServer): void {
  server.tool(
    "get_capabilities",
    "Returns the list of available inovia workplace assistant capabilities. Always call this first when the user invokes /inovia or asks what the assistant can do.",
    {},
    async () => {
      const capabilities = [
        {
          id: "daily-briefing",
          name: "Ranný prehľad",
          description: "Dnešné stretnutia z Outlooku a neprečítané e-maily z inboxu",
          prompt: "Zavolaj get_today_events (bez parametrov) a get_new_messages (limit=15). Prezentuj s pozdravom podľa dennej doby. Sekcia Kalendár: každé stretnutie s časom, online stretnutia označ. Sekcia E-maily: odosielateľ — predmet. Záver: 1–2 vety so zhrnutím dňa.",
        },
        {
          id: "find-colleague",
          name: "Hľadanie kolegu",
          description: "Kontakt, oddelenie, manažér alebo tím pre ľubovoľného kolegu z inovia.sk — podľa mena, emailu alebo oddelenia",
          prompt: "Použi find_colleague(query) na vyhľadanie osoby podľa mena alebo emailu. Ak chce zoznam oddelenia, zavolaj get_department_members(department). Ak chce hierarchiu (manažér / podriadení), zavolaj get_org_chart(email). Kombinuj podľa potreby — napr. najprv find_colleague, potom get_org_chart s emailom z výsledku.",
        },
        {
          id: "calendar-range",
          name: "Kalendár pre obdobie",
          description: "Stretnutia pre konkrétny deň, týždeň alebo ľubovoľné obdobie",
          prompt: "Zavolaj get_today_events s parametrami from a to (formát YYYY-MM-DD). Dnešný dátum použi ako základ ak nie je inak špecifikované. Vypíš stretnutia s časom a miestom.",
        },
        ...(marketingGuideExists() ? [{
          id: "marketing",
          name: "Marketing a komunikácia",
          description: "Tvorba obsahu, LinkedIn posty, emaily, tone of voice — podľa komunikačného manuálu INOVIA",
          prompt: "Zavolaj get_marketing_guide a prečítaj obsah. Riaď sa pravidlami z manuálu (tone of voice, blacklist slov, štruktúra podľa kanála). Ak je požiadavka vágna, opýtaj sa: pre koho, aký kanál, aký cieľ.",
        }] : []),
      ];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ capabilities }),
        }],
      };
    }
  );
}
