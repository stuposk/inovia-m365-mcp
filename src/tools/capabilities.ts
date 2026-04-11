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
          description: "Dnešné stretnutia z Outlooku a neprečítané e-maily",
          triggers: ["ranný prehľad", "čo mám dnes", "daily briefing", "prehľad dňa"],
          prompt: "Zavolaj get_today_events bez parametrov a get_new_messages s limit=15. Prezentuj výsledky s pozdravom podľa dennej doby, sekciou Kalendár a sekciou E-maily. Záver: 1–2 vety so zhrnutím dňa.",
        },
        {
          id: "find-colleague",
          name: "Hľadanie kolegu",
          description: "Kontakt, oddelenie, manažér a tím pre ľubovoľného kolegu z inovia.sk",
          triggers: ["kto je", "hľadaj kolegu", "find colleague", "kontakt na", "kto pracuje v"],
          prompt: "Podľa otázky: použij find_colleague na hľadanie podľa mena/emailu, get_department_members na výpis oddelenia, get_org_chart na hierarchiu. Kombinuj podľa potreby.",
        },
        {
          id: "calendar-range",
          name: "Kalendár pre obdobie",
          description: "Stretnutia pre ľubovoľný dátumový rozsah — týždeň, mesiac, konkrétny deň",
          triggers: ["stretnutia tento týždeň", "kalendár na", "čo mám zajtra", "meetings this week"],
          prompt: "Zavolaj get_today_events s parametrami from a to vo formáte YYYY-MM-DD podľa požiadavky používateľa.",
        },
        ...(marketingGuideExists() ? [{
          id: "marketing-guide",
          name: "Marketingový manuál",
          description: "Tone of voice, komunikačné pravidlá a šablóny pre externú komunikáciu inovia.sk",
          triggers: ["marketing", "komunikácia", "tone of voice", "ako písať", "manuál"],
          prompt: "Zavolaj get_marketing_guide a použi obsah ako základ pre odpoveď na otázku používateľa o komunikácii alebo marketingu.",
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
