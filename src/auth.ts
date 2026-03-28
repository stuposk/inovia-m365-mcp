import * as msal from "@azure/msal-node";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const CACHE_DIR = path.join(os.homedir(), ".inovia-m365-mcp");
const CACHE_FILE = path.join(CACHE_DIR, "token-cache.json");

const SCOPES = [
  "https://graph.microsoft.com/Calendars.Read",
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
];

function loadConfig(): { clientId: string; tenantId: string } {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !tenantId) {
    throw new Error(
      "Missing AZURE_CLIENT_ID or AZURE_TENANT_ID environment variables.\n" +
        "Copy .env.example to .env and fill in the values from your IT admin."
    );
  }
  return { clientId, tenantId };
}

function loadCachePlugin(): msal.ICachePlugin {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true, mode: 0o700 });
  }

  return {
    beforeCacheAccess: async (context: msal.TokenCacheContext) => {
      if (fs.existsSync(CACHE_FILE)) {
        context.tokenCache.deserialize(fs.readFileSync(CACHE_FILE, "utf8"));
      }
    },
    afterCacheAccess: async (context: msal.TokenCacheContext) => {
      if (context.cacheHasChanged) {
        fs.writeFileSync(CACHE_FILE, context.tokenCache.serialize(), {
          encoding: "utf8",
          mode: 0o600,
        });
      }
    },
  };
}

let _pca: msal.PublicClientApplication | null = null;

function getPca(): msal.PublicClientApplication {
  if (_pca) return _pca;

  const { clientId, tenantId } = loadConfig();

  _pca = new msal.PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: {
      cachePlugin: loadCachePlugin(),
    },
  });

  return _pca;
}

async function getAccountFromCache(): Promise<msal.AccountInfo | null> {
  const pca = getPca();
  const accounts = await pca.getTokenCache().getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function getAccessToken(): Promise<string> {
  const pca = getPca();

  // Try silent auth first (uses cached refresh token)
  const account = await getAccountFromCache();
  if (account) {
    try {
      const result = await pca.acquireTokenSilent({
        scopes: SCOPES,
        account,
      });
      if (result?.accessToken) {
        return result.accessToken;
      }
    } catch {
      // Silent failed — fall through to device code
    }
  }

  // First run or token expired: use device code flow
  // This prints a URL + code to stderr so the user can authenticate from any device
  const result = await pca.acquireTokenByDeviceCode({
    scopes: SCOPES,
    deviceCodeCallback: (response) => {
      // Write to stderr so it appears in Claude Code output without polluting MCP stdio
      process.stderr.write("\n" + "=".repeat(60) + "\n");
      process.stderr.write("INOVIA M365 — Microsoft Login Required\n");
      process.stderr.write("=".repeat(60) + "\n");
      process.stderr.write(response.message + "\n");
      process.stderr.write("=".repeat(60) + "\n\n");
    },
  });

  if (!result?.accessToken) {
    throw new Error("Authentication failed — no access token received.");
  }

  return result.accessToken;
}
