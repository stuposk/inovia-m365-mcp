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
   - Redirect URI: nechaj prázdne
4. Klikni **Register**
5. Poznač si:
   - **Application (client) ID** → toto je `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → toto je `AZURE_TENANT_ID`

### 2. Vytvor Client Secret

1. V registrácii aplikácie choď na **Certificates & secrets → Client secrets → New client secret**
2. Vyplň popis (napr. `inovia-m365-mcp`) a zvol platnosť (napr. 24 mesiacov)
3. Klikni **Add**
4. **Okamžite si skopíruj hodnotu** zo stĺpca *Value* — po opustení stránky ju už neuvidíš
5. Toto je `AZURE_CLIENT_SECRET`

### 3. Nastavenie oprávnení

1. V registrácii aplikácie choď na **API permissions → Add a permission → Microsoft Graph → Application permissions**
2. Pridaj tieto oprávnenia:
   - `Calendars.Read`
   - `Mail.Read`
3. Klikni **Grant admin consent for inovia.sk** (dôležité — bez toho aplikácia nebude fungovať)

### 4. Zdieľaj hodnoty so zamestnancami

Každému zamestnancovi pošli:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_SECRET`

Každý zamestnanec si nastaví vlastný `AZURE_USER_EMAIL` — svoj @inovia.sk e-mail.

---

## Nastavenie pre zamestnancov

### Predpoklady

- [Node.js 20+](https://nodejs.org) — stiahni a nainštaluj (len raz)
- Claude Code — musí byť nainštalovaný

### Krok 1 — Stiahni a zostav projekt

```bash
git clone https://github.com/stuposk/inovia-m365-mcp inovia-m365-mcp
cd inovia-m365-mcp
npm install
npm run build
```

### Krok 2 — Vytvor konfiguračný súbor

Skopíruj `.env.example` do `.env`:
```bash
cp .env.example .env
```

Otvor `.env` v textovom editore a doplň hodnoty od IT administrátora + svoj e-mail:
```
AZURE_CLIENT_ID=xxxx-xxxx-xxxx-xxxx
AZURE_TENANT_ID=xxxx-xxxx-xxxx-xxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
AZURE_USER_EMAIL=meno.priezvisko@inovia.sk
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

### Krok 5 — Otestuj

1. Otvor Claude Code
2. Napíš `/daily-briefing`
3. Prehľad sa zobrazí automaticky — žiadne prihlasovanie nie je potrebné

---

## Štruktúra projektu

```
inovia-m365-mcp/
├── src/
│   ├── server.ts          # MCP server (vstupný bod)
│   ├── auth.ts            # Autentifikácia cez Microsoft (MSAL client credentials)
│   ├── graph.ts           # Volania Microsoft Graph API
│   ├── setup.ts           # Validácia konfigurácie pri štarte
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

**"Chýbajú premenné v .env: AZURE_CLIENT_SECRET"** (alebo iná premenná)
→ Skontroluj, či máš v `.env` všetky štyri hodnoty: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_USER_EMAIL`.

**"Access token could not be acquired"**
→ Skontroluj, či IT admin udelil admin consent pre oprávnenia `Calendars.Read` a `Mail.Read` (Application permissions).

**"Resource not found" alebo prázdny kalendár**
→ Skontroluj, či je `AZURE_USER_EMAIL` správny @inovia.sk e-mail.

**Nevidím `/daily-briefing` príkaz**
→ Skontroluj, či je SKILL.md na správnom mieste: `~/.claude/skills/daily-briefing/SKILL.md`
