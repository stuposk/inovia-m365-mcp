# inovia-m365-mcp

Microsoft 365 MCP server pre inovia.sk — ranný prehľad kalendára a doručenej pošty v Claude Code.

Tento nástroj umožňuje kolegom bez technických znalostí získať prehľad dňa jednoducho napísaním `/daily-briefing` v Claude Code.

---

## Čo to robí

Po nastavení stačí napísať `/daily-briefing` a Claude Code:
1. Načíta dnešné udalosti z tvojho Outlook kalendára
2. Načíta neprečítané e-maily z tvojho inboxu
3. Zobrazí prehľad v peknom formáte

---

## Nastavenie (pre IT administrátora)

Tento krok treba spraviť raz pre celú firmu.

### 1. Registrácia aplikácie v Azure AD

1. Prihlás sa do [Azure Portal](https://portal.azure.com) s admin účtom inovia.sk
2. Choď na **Azure Active Directory → App registrations → New registration**
3. Vyplň:
   - Name: `inovia-m365-mcp`
   - Supported account types: **Accounts in this organizational directory only (inovia.sk only)**
   - Redirect URI: Platform = **Mobile and desktop applications**, URI = `http://localhost`
4. Klikni **Register**
5. Poznač si:
   - **Application (client) ID** → toto je `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → toto je `AZURE_TENANT_ID`

### 2. Nastavenie oprávnení

1. V registrácii aplikácie choď na **API permissions → Add a permission → Microsoft Graph → Delegated permissions**
2. Pridaj tieto oprávnenia:
   - `Calendars.Read`
   - `Mail.Read`
   - `User.Read`
   - `offline_access`
3. Klikni **Grant admin consent for inovia.sk** (dôležité — inak by každý zamestnanec musel súhlasiť manuálne)

Zdieľaj hodnoty `AZURE_CLIENT_ID` a `AZURE_TENANT_ID` so zamestnancami.

---

## Nastavenie pre zamestnancov

### Predpoklady

- [Node.js 20+](https://nodejs.org) — stiahni a nainštaluj (len raz)
- Claude Code — musí byť nainštalovaný

### Krok 1 — Stiahni a zostav projekt

```bash
git clone <repo-url> inovia-m365-mcp
cd inovia-m365-mcp
npm install
npm run build
```

### Krok 2 — Vytvor konfiguračný súbor

Skopíruj `.env.example` do `.env`:
```bash
cp .env.example .env
```

Otvor `.env` v textovom editore a doplň hodnoty od IT administrátora:
```
AZURE_CLIENT_ID=xxxx-xxxx-xxxx-xxxx
AZURE_TENANT_ID=xxxx-xxxx-xxxx-xxxx
```

### Krok 3 — Zaregistruj MCP server v Claude Code

Spusti tento príkaz (cesta musí zodpovedať tomu, kde si projekt stiahol):

```bash
claude mcp add --scope user inovia-m365 -- node /CESTA/K/inovia-m365-mcp/dist/server.js
```

Príklad (Mac, ak si stiahol do priečinka Dokumenty):
```bash
claude mcp add --scope user inovia-m365 -- node ~/Documents/inovia-m365-mcp/dist/server.js
```

### Krok 4 — Nainštaluj skill

```bash
mkdir -p ~/.claude/skills/daily-briefing
cp skill/daily-briefing/SKILL.md ~/.claude/skills/daily-briefing/SKILL.md
```

### Krok 5 — Prvé prihlásenie

1. Otvor Claude Code
2. Napíš `/daily-briefing`
3. V termináli sa zobrazí správa s odkazom a kódom, napr.:

```
============================================================
INOVIA M365 — Microsoft Login Required
============================================================
To sign in, use a web browser to open the page
https://microsoft.com/devicelogin and enter the code ABC123DEF
============================================================
```

4. Otvor tento odkaz v prehliadači, zadaj kód a prihlás sa svojím @inovia.sk účtom
5. Po prihlásení sa vráť do Claude Code — prehľad sa zobrazí automaticky

Každé ďalšie spustenie `/daily-briefing` bude okamžité — prihlásenie si pamätá.

---

## Štruktúra projektu

```
inovia-m365-mcp/
├── src/
│   ├── server.ts          # MCP server (vstupný bod)
│   ├── auth.ts            # Autentifikácia cez Microsoft (MSAL)
│   ├── graph.ts           # Volania Microsoft Graph API
│   └── tools/
│       ├── calendar.ts    # Nástroj get_today_events
│       └── mail.ts        # Nástroj get_new_messages
├── skill/
│   └── daily-briefing/
│       └── SKILL.md       # Claude Code skill (/daily-briefing)
├── .env.example           # Šablóna konfigurácie
└── README.md
```

---

## Riešenie problémov

**"Missing AZURE_CLIENT_ID or AZURE_TENANT_ID"**
→ Skontroluj, či máš vytvorený `.env` súbor so správnymi hodnotami.

**Po prihlásení sa nič nestane**
→ Počkaj niekoľko sekúnd — MCP server sa inicializuje po úspešnom prihlásení.

**"Authentication failed"**
→ Vymaž prihlásenie a skús znova:
```bash
rm ~/.inovia-m365-mcp/token-cache.json
```

**Nevidím `/daily-briefing` príkaz**
→ Skontroluj, či je SKILL.md na správnom mieste: `~/.claude/skills/daily-briefing/SKILL.md`
