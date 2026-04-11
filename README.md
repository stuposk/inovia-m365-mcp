# inovia-m365-mcp

Microsoft 365 MCP server pre inovia.sk — ranný prehľad kalendára a doručenej pošty v Claude Code a Cowork.

---

## Čo to robí

Napíš `/daily-briefing` a Claude:
1. Načíta dnešné udalosti z tvojho Outlook kalendára
2. Načíta neprečítané e-maily z tvojho inboxu
3. Zobrazí prehľad v peknom formáte

---

## Pre zamestnancov — Claude Cowork (plugin)

Najjednoduchší spôsob — žiadna inštalácia Node.js ani terminál.

### Krok 1 — Stiahni a nainštaluj plugin

1. Stiahni súbor **[inovia-m365.plugin](https://github.com/stuposk/inovia-m365-mcp/releases/latest/download/inovia-m365.plugin)**
2. V Claude Cowork klikni na **Customize → Browse plugins → Upload plugin**
3. Vyber stiahnutý súbor

### Krok 2 — Pripoj svoj účet

Po inštalácii napíš čokoľvek — Claude ťa prevedie prihlásením. Alebo priamo:

1. Otvor v prehliadači: `https://inovia-m365-mcp-521967815165.europe-west1.run.app/auth/login`
2. Prihlás sa svojím `@inovia.sk` Microsoft účtom
3. Skopíruj svoju osobnú URL adresu MCP servera zo stránky
4. V Cowork: **Nastavenia → MCP servery** → vlož URL (nahradí pôvodnú)

Platnosť prihlásenia je **30 dní**. Po vypršaní zopakuj kroky 1–4.

---

## Pre zamestnancov — Claude Code (vývojári)

### Krok 1 — Pridaj MCP server

```bash
claude mcp add inovia-m365 --transport http https://inovia-m365-mcp-521967815165.europe-west1.run.app/mcp
```

### Krok 2 — Pripoj svoj účet

1. Otvor v prehliadači: `https://inovia-m365-mcp-521967815165.europe-west1.run.app/auth/login`
2. Prihlás sa svojím `@inovia.sk` Microsoft účtom
3. Skopíruj svoju osobnú URL adresu MCP servera
4. Aktualizuj MCP konfiguráciu s osobnou URL:

```bash
claude mcp remove inovia-m365
claude mcp add inovia-m365 --transport http <tvoja-osobná-url>
```

### Krok 3 — Nainštaluj skill

```bash
mkdir -p ~/.claude/skills/daily-briefing
cp plugin/skills/daily-briefing/SKILL.md ~/.claude/skills/daily-briefing/SKILL.md
```

### Krok 4 — Otestuj

Napíš `/daily-briefing` v Claude Code.

---

## Pre IT administrátora — nastavenie servera

Tento krok treba spraviť raz pre celú firmu.

### 1. Registrácia aplikácie v Azure AD

1. Prihlás sa do [Azure Portal](https://portal.azure.com) s admin účtom inovia.sk
2. Choď na **Microsoft Entra ID → App registrations → New registration**
3. Vyplň:
   - Name: `inovia-m365-mcp`
   - Supported account types: **Accounts in this organizational directory only**
4. Klikni **Register**
5. Poznač si **Application (client) ID** a **Directory (tenant) ID**

### 2. Redirect URI a ID tokeny

1. V registrácii choď na **Authentication → Add a platform → Web**
2. Redirect URI: `https://inovia-m365-mcp-521967815165.europe-west1.run.app/auth/callback`
3. Zaškrtni **ID tokens** (Implicit grant)
4. Klikni **Save**

### 3. Client Secret

1. Choď na **Certificates & secrets → New client secret**
2. Zvol platnosť (napr. 24 mesiacov), klikni **Add**
3. **Okamžite skopíruj hodnotu** — po opustení stránky ju neuvidíš

### 4. API oprávnenia

1. Choď na **API permissions → Add a permission → Microsoft Graph → Application permissions**
2. Pridaj:
   - `Calendars.Read`
   - `Mail.Read`
3. Klikni **Grant admin consent for inovia.sk**

### 5. Nasadenie na Cloud Run

```bash
gcloud run deploy inovia-m365-mcp \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated
```

Pridaj tieto premenné v Cloud Run → **Variables & Secrets**:

| Premenná | Hodnota |
|---|---|
| `AZURE_CLIENT_ID` | Application (client) ID z Azure |
| `AZURE_TENANT_ID` | Directory (tenant) ID z Azure |
| `AZURE_CLIENT_SECRET` | Client secret z Azure |
| `SERVICE_URL` | `https://inovia-m365-mcp-521967815165.europe-west1.run.app` |
| `JWT_SECRET` | výstup príkazu `openssl rand -base64 32` |

---

## Lokálne spustenie (stdio)

Pre vývoj a testovanie bez Cloud Run.

### Predpoklady

- Node.js 20+

### Inštalácia

```bash
git clone https://github.com/stuposk/inovia-m365-mcp
cd inovia-m365-mcp
npm install
npm run build
```

### Konfigurácia

```bash
cp .env.example .env
```

Doplň do `.env`:
```
AZURE_CLIENT_ID=xxxx
AZURE_TENANT_ID=xxxx
AZURE_CLIENT_SECRET=xxxx
AZURE_USER_EMAIL=meno.priezvisko@inovia.sk
```

### Registrácia v Claude Code

```bash
claude mcp add --scope user inovia-m365 -- node /cesta/k/inovia-m365-mcp/dist/server.js
```

---

## Štruktúra projektu

```
inovia-m365-mcp/
├── src/
│   ├── server.ts          # MCP server — HTTP (Cloud Run) aj stdio (lokálne)
│   ├── auth.ts            # Microsoft OAuth + JWT session tokeny
│   ├── graph.ts           # Microsoft Graph API volania
│   ├── setup.ts           # Validácia konfigurácie
│   └── tools/
│       ├── calendar.ts    # Nástroj get_today_events
│       └── mail.ts        # Nástroj get_new_messages
├── plugin/
│   ├── README.md          # Plugin dokumentácia
│   └── skills/
│       └── daily-briefing/
│           └── SKILL.md   # Skill pre Cowork
├── skill/
│   └── daily-briefing/
│       └── SKILL.md       # Skill pre Claude Code
└── Dockerfile
```

---

## Riešenie problémov

**Nástroje nefungujú — "authentication required"**
→ Token vypršal alebo nie je nastavený. Navštív `/auth/login` a aktualizuj URL.

**"Nepovolený účet"**
→ Prihlasuj sa výhradne @inovia.sk Microsoft účtom.

**"Graph auth failed"**
→ Skontroluj, či IT admin nastavil správne `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` a udelil admin consent.

**"Resource not found" alebo prázdny kalendár**
→ Skontroluj, či admin consent zahŕňa `Calendars.Read` a `Mail.Read` (Application permissions).
