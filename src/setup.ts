export async function runSetupIfNeeded(): Promise<void> {
  const required = ["AZURE_CLIENT_ID", "AZURE_TENANT_ID", "AZURE_CLIENT_SECRET", "AZURE_USER_EMAIL"];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length === 0) return;

  process.stderr.write("\n" + "=".repeat(60) + "\n");
  process.stderr.write("  INOVIA M365 MCP — Chýba konfigurácia\n");
  process.stderr.write("=".repeat(60) + "\n");
  process.stderr.write(`  Chýbajúce premenné: ${missing.join(", ")}\n\n`);
  process.stderr.write("  Nastav ich v súbore .env v koreňovom adresári projektu.\n");
  process.stderr.write("=".repeat(60) + "\n\n");
  process.exit(1);
}
