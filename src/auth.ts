import * as msal from "@azure/msal-node";

function getConfig(): { clientId: string; tenantId: string; clientSecret: string } {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) {
    const missing = [
      !clientId && "AZURE_CLIENT_ID",
      !tenantId && "AZURE_TENANT_ID",
      !clientSecret && "AZURE_CLIENT_SECRET",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Chýbajú premenné v .env: ${missing}`);
  }

  return { clientId, tenantId, clientSecret };
}

let _cca: msal.ConfidentialClientApplication | null = null;

function getCca(): msal.ConfidentialClientApplication {
  if (_cca) return _cca;

  const { clientId, tenantId, clientSecret } = getConfig();

  _cca = new msal.ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  return _cca;
}

export async function getAccessToken(): Promise<string> {
  const cca = getCca();

  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new Error("Authentication failed — no access token received.");
  }

  return result.accessToken;
}

export function getUserEmail(): string {
  const email = process.env.AZURE_USER_EMAIL;
  if (!email) {
    throw new Error("Chýba AZURE_USER_EMAIL v .env súbore.");
  }
  return email;
}
