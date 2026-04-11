import * as msal from "@azure/msal-node";
import { SignJWT, jwtVerify } from "jose";

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

// Used only in stdio (local) mode — email comes from env var
export function getEmailFromEnv(): string {
  const email = process.env.AZURE_USER_EMAIL;
  if (!email) {
    throw new Error("AZURE_USER_EMAIL is required for local (stdio) mode.");
  }
  return email;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export function getOAuthAuthorizationUrl(): string {
  const { clientId, tenantId } = getConfig();
  const serviceUrl = process.env.SERVICE_URL;
  if (!serviceUrl) throw new Error("SERVICE_URL env var is not set");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${serviceUrl}/auth/callback`,
    response_mode: "query",
    scope: "openid profile email",
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForEmail(code: string): Promise<string> {
  const { clientId, tenantId, clientSecret } = getConfig();
  const serviceUrl = process.env.SERVICE_URL;
  if (!serviceUrl) throw new Error("SERVICE_URL env var is not set");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: `${serviceUrl}/auth/callback`,
    grant_type: "authorization_code",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("No id_token in token response");

  // Decode payload without signature verification — received directly from Microsoft over TLS
  const parts = data.id_token.split(".");
  if (parts.length < 2) throw new Error("Malformed id_token");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

  const email: string = payload.preferred_username ?? payload.email ?? payload.upn ?? "";
  if (!email) throw new Error("Could not extract email from id_token");
  if (!email.toLowerCase().endsWith("@inovia.sk")) {
    throw new Error(`Nepovolený účet: ${email} nie je @inovia.sk`);
  }

  return email;
}

export async function signUserJwt(email: string): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setSubject(email)
    .sign(secret);
}

export async function verifyUserJwt(token: string): Promise<{ email: string }> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  const email = payload.email as string;
  if (!email) throw new Error("JWT missing email claim");
  return { email };
}
