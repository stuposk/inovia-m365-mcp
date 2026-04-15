# Roadmap — inovia-m365-mcp

Prehľad plánovaných funkcií zoskupených podľa oblasti. Aktuálne implementované funkcie sú označené ✅.

---

## Infraštruktúra

- ✅ Remote server s Microsoft OAuth autorizáciou (Cloud Run)
- ✅ Per-user JWT session tokeny (30 dní)
- ✅ Onboarding flow — Claude prevedie novým používateľom prihlásením
- ✅ Claude Cowork plugin (`inovia.zip`)
- [ ] **MCP OAuth 2.1 — natívna autentifikácia cez Cowork** (viď sekciu nižšie)
- [ ] Logging a štatistiky do Firestore (aktívni používatelia, počet volaní per user/deň)

---

## MCP OAuth 2.1 — migrácia z JWT na natívny OAuth

### Prečo

Teraz: každý používateľ musí ísť na `/auth/login`, skopírovať osobnú URL s JWT tokenom a ručne ju vložiť do custom connectora. Cowork ale podporuje natívny OAuth — používateľ len klikne "Install" a prihlási sa. Žiadne kopírovanie URL.

### Ako to funguje — MCP Authorization spec

MCP špecifikácia definuje OAuth 2.1 flow pre HTTP transport:
- Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
- Založené na [OAuth 2.1 IETF DRAFT](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12)
- Metadata discovery: [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414)
- Dynamic client registration: [RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591)

### Flow — Third-Party Authorization (náš prípad)

Náš server = OAuth authorization server + resource server.
Microsoft = third-party auth provider.

```
1. Cowork → POST /mcp → server vráti 401 Unauthorized
2. Cowork → GET /.well-known/oauth-authorization-server → metadata s endpointmi
3. Cowork → otvorí prehliadač na /authorize?code_challenge=...&redirect_uri=...
4. Server → presmeruje na Microsoft OAuth (login.microsoftonline.com)
5. Používateľ sa prihlási cez @inovia.sk účet
6. Microsoft → callback na server s auth code
7. Server → vymení code za MS access token
8. Server → vygeneruje vlastný MCP access token (viazaný na MS session)
9. Server → presmeruje prehliadač späť na Cowork callback s MCP auth code
10. Cowork → POST /token s auth code + code_verifier (PKCE)
11. Server → vráti MCP access token (+ refresh token)
12. Cowork → odteraz posiela Authorization: Bearer <token> v každom requeste
```

### Čo musíme implementovať na serveri

| Endpoint | Metóda | Čo robí |
|---|---|---|
| `/.well-known/oauth-authorization-server` | GET | Metadata — zoznam OAuth endpointov, supported grant types, PKCE |
| `/authorize` | GET | Spustí OAuth flow — validuje parametre, presmeruje na Microsoft |
| `/token` | POST | Vymení auth code za access token, podporuje refresh_token grant |
| `/register` | POST | (voliteľné) Dynamic client registration ([RFC 7591](https://datatracker.ietf.org/doc/html/rfc7591)) |

### Metadata response (`/.well-known/oauth-authorization-server`)

```json
{
  "issuer": "https://inovia-m365-mcp-521967815165.europe-west1.run.app",
  "authorization_endpoint": "https://inovia-m365-mcp-521967815165.europe-west1.run.app/authorize",
  "token_endpoint": "https://inovia-m365-mcp-521967815165.europe-west1.run.app/token",
  "registration_endpoint": "https://inovia-m365-mcp-521967815165.europe-west1.run.app/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"]
}
```

### Zmeny na serveri

1. **`/mcp` endpoint** — ak request nemá `Authorization: Bearer` header a ani `?token=` query param → vrátiť **401 Unauthorized**
2. **Nové OAuth endpointy** — `/.well-known`, `/authorize`, `/token`
3. **Token storage** — mapovanie MCP token → Microsoft token → email (Firestore alebo in-memory)
4. **PKCE validácia** — code_challenge/code_verifier podľa [OAuth 2.1 Section 4.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#section-4.1)
5. **Bearer token handling** — čítať `Authorization: Bearer <token>` z HTTP headeru, validovať, získať email

### Zmeny v Azure App Registration

- Pridať redirect URI pre náš `/callback` endpoint (server-to-server, nie Cowork)
- Existujúci redirect URI (`/auth/callback`) zostáva — pre spätnú kompatibilitu

### Zmeny v plugin.json

```json
{
  "mcpServers": {
    "inovia-m365": {
      "url": "https://inovia-m365-mcp-521967815165.europe-west1.run.app/mcp"
    }
  }
}
```

Jedna URL pre všetkých — žiadne osobné tokeny. Cowork vie OAuth Client ID + Secret z Advanced Settings (alebo cez Dynamic Registration).

### Migračný plán

1. **Fáza 1 — Duálny mode** — server akceptuje aj starý JWT (`?token=`) aj nový Bearer token. Existujúci používatelia fungujú ďalej.
2. **Fáza 2 — Nový plugin** — plugin.json s `mcpServers` URL bez tokenu. Noví používatelia idú cez OAuth.
3. **Fáza 3 — Deprecation** — po tom čo všetci migrujú, zrušiť JWT flow a `/auth/login` stránku.

### Čo sa zmení pre používateľov

| | Teraz | Po migrácii |
|---|---|---|
| Connector URL | Osobná s tokenom | Jedna spoločná |
| Prihlásenie | Manuálne — `/auth/login` → kopírovanie URL | Automatické — Cowork OAuth popup |
| Token obnova | Manuálne po 30 dňoch | Automatické (refresh token) |
| Inštalácia | Stiahnuť ZIP + pridať connector ručne | Stiahnuť ZIP → funguje |

### Referencie

- MCP Authorization spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
- MCP Transports spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
- OAuth 2.1 IETF Draft: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12
- RFC 8414 — OAuth 2.0 Authorization Server Metadata: https://datatracker.ietf.org/doc/html/rfc8414
- RFC 7591 — OAuth 2.0 Dynamic Client Registration: https://datatracker.ietf.org/doc/html/rfc7591
- Cowork connectors docs: https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- Custom integrations docs: https://support.claude.com/en/articles/11175166-about-custom-integrations-using-remote-mcp
- Known bug — VM network allowlist: https://github.com/anthropics/claude-code/issues/28067

---

## Kalendár (`Calendars.Read`)

- ✅ Zobraziť dnešné stretnutia (`/daily-briefing`)
- ✅ Zobraziť stretnutia pre ľubovoľný dátumový rozsah
- [ ] Skontrolovať voľný čas kolegu (free/busy)
- [ ] Navrhnúť optimálny čas stretnutia pre viacerých ľudí
- [ ] Vytvoriť udalosť / pozvánku (`Calendars.ReadWrite`)
- [ ] Presunúť alebo zrušiť stretnutie (`Calendars.ReadWrite`)

## Maily — čítanie (`Mail.Read`)

- ✅ Zobraziť neprečítané e-maily (`/daily-briefing`)
- [ ] Prečítať celý obsah mailu (nie len náhľad)
- [ ] Vyhľadať maily podľa odosielateľa / témy / dátumu
- [ ] Označiť maily ako prečítané (`Mail.ReadWrite`)

## Maily — písanie a odosielanie (`Mail.Send`)

- [ ] Pripraviť návrh odpovede na mail
- [ ] Odoslať odpoveď priamo z Claude
- [ ] Vytvoriť nový mail (draft alebo odoslať)

## Používatelia (`User.Read.All`)

- ✅ Vyhľadať kolegu podľa mena alebo oddelenia
- ✅ Zobraziť org chart — manažér a priame podriadené
- [ ] Automaticky doplniť príjemcov podľa mena (pri písaní mailu)
- [ ] Free/busy lookup pre konkrétneho kolegu

---

## Personalizácia (`Firestore`)

- [ ] `get_preferences` / `set_preferences` — per-user nastavenia uložené vo Firestore
- [ ] Konfigurovateľný ranný prehľad: počet udalostí, počet mailov, sekcia urgent
- [ ] Skill context súbory (`data/skills/<id>.md`) s detailnými inštrukciami per capability
- [ ] `get_skill_context(id)` tool — Claude si načíta inštrukcie podľa aktívnej capability

---

## Plánované skill-y

| Skill | Čo robí | Zodpovedný | Stav |
|---|---|---|---|
| `/daily-briefing` | Ranný prehľad — kalendár + neprečítané maily | MiSt | ✅ hotové |
| `/find-colleague` | Mapa organizácie — vyhľadanie kolegu, org chart, kontakty | MiSt | ✅ hotové |
| `/marketing` | Komunikačný manuál — tvorba obsahu podľa tone of voice INOVIA | SiMi / MiSt | ✅ hotové |
| `/tomorrow-briefing` | Briefing programu na zajtra | MiZa | nové |
| `/mapping` | Mapovanie firiem — research, zápis zo stretnutia, formulár | MiSt | plánované |
| `/zsk-review` | Hodnotenie prezentácií IŽK — pravidlá, pitch deck, kategórie | VlKo / MiSt | plánované |
| `/municipality-innovation` | Budovanie inovácií v samospráve | MiZa | plánované |
| `/mip-tuner` | Ladič formulácií pre MIP projekty | MiZa | plánované |
| `/agenda` | Agenda oblasti + interný helpdesk per OJ | MiSt | plánované |
| `/timesheet` | Vyplnenie výkazu prác | MiSt | plánované |
| `/startups` | Startupy — podpora a mentoring | MiPo | plánované |
| `/mail-review` | Prečíta dnešné maily, zhrnie každý, navrhne odpovede | — | plánované |
| `/send-reply` | Odošle pripravenú odpoveď na konkrétny mail | — | plánované |
| `/schedule-meeting` | Naplánuje stretnutie s kolegom (free/busy) | — | plánované |
| `/weekly-prep` | Prehľad týždňa — stretnutia + nevybavené maily | — | plánované |

---

## Mapovanie — `/mapping`

Tím Mapovania sa stretáva s firmami (v rámci ZSK aj mimo neho). Asistent podporuje celý cyklus od prípravy po vyplnenie formulára.

### Fáza 1 — Príprava a research firmy

Pred stretnutím alebo po získaní prezentácie:
- Nahranie materiálov firmy (PDF / PPTX) do priečinka Inovia
- Research o firme — web, LinkedIn, verejné zdroje
- Extrahovanie kľúčových údajov: produkt, tím, trh, trakcia, financovanie

### Fáza 2 — Zápis zo stretnutia s firmou

Po rozhovore s firmou:
- Štruktúrovaný zápis podľa šablóny INOVIA / Mapovania
- Identifikácia silných stránok, rizík, inovačného potenciálu
- Porovnanie s predchádzajúcimi firmami (ak sú záznamy k dispozícii)

### Fáza 3 — Vyplnenie hodnotiaceho formulára

Na základe záznamu zo stretnutia:
- Načítanie otázok z hodnotiaceho formulára (napr. ZSK — nahrať ako súbor do Inovia)
- Automatické mapovanie údajov zo záznamu na jednotlivé otázky formulára
- Návrh odpovedí s možnosťou úpravy pred potvrdením

### Čo je potrebné pripraviť

- [ ] `data/skills/mapping/skill.md` — inštrukcie pre celý workflow (research → zápis → formulár)
- [ ] Šablóna záznamu zo stretnutia pre Mapovanie
- [ ] Hodnotiaci formulár ZSK ako referenčný súbor (otázky a typy polí)
- [ ] Skill `/mapping` v `get_capabilities` — orchestruje celý postup
- [ ] Podpora čítania PDF/PPTX súborov z priečinka Inovia (cez Context)

---

## Agenda — interný helpdesk pre každú OJ

Každá organizačná jednotka má svoje vlastné procesy, formuláre, kontakty a termíny. `/agenda` funguje ako **interný helpdesk** — používateľ sa opýta a asistent odpovie priamo, personalizovane podľa OJ z profilu.

### Princíp — najprv odpovedz, až potom odporúčaj kontakt

Asistent sa **najprv pokúsi odpovedať sám** na základe znalostí o OJ. Až ak nevie, odporučí konkrétnu osobu. Toto je kľúčový rozdiel oproti klasickému "spýtaj sa kolegu X".

Príklady:

| Otázka | Zlá odpoveď | Dobrá odpoveď |
|---|---|---|
| „Kde je výkaz práce?" | „Kontaktuj finančného managera." | „Výkaz práce nájdeš tu: [link na SharePoint]. Vypĺňa sa mesačne do 5. dňa nasledujúceho mesiaca." |
| „Koho kontaktovať kvôli cesťáku?" | „Spýtaj sa Jany Kováčovej." | „Cestovný príkaz vyplníš cez [link]. Ak máš otázky k schvaľovaniu, rieši to Jana Kováčová (financny.manager@inovia.sk)." |
| „Kedy máme porady?" | „Pozri si kalendár." | „RC Žilina má porady každý utorok o 9:00. Zápisnica sa ukladá do [Teams priečinok]." |

### Štruktúra skill súborov

Každá OJ dostane vlastný súbor `data/skills/agenda/<oj>/skill.md` so sekciami:

**1. FAQ — najčastejšie otázky s priamymi odpoveďami**
- Výkazy práce — kde, kedy, ako
- Cestovné príkazy — postup, schvaľovanie, linky
- Dovolenky — ako nahlásiť, komu
- IT problémy — koho kontaktovať, self-service linky

**2. Kontakty — kto rieši čo**
- Meno, email, oblasť zodpovednosti
- Nie len mená — aj kedy kontaktovať (napr. "len ak self-service nefunguje")

**3. Kľúčové súbory a priečinky**
- SharePoint / Teams linky na zdieľané dokumenty
- Šablóny (výkazy, reporty, zápisnice)
- Interné nástroje a systémy

**4. Pravidelné udalosti**
- Porady — deň, čas, miesto/link
- Deadliny — mesačné reporty, uzávierky
- Opakujúce sa aktivity (napr. team review každý piatok)

### Ako to funguje technicky

1. Používateľ sa opýta (napr. "kde nájdem výkaz práce?")
2. `get_capabilities` → asistent vyberie `/agenda` capability (`hasContext: true`)
3. `get_skill_context('agenda')` → server prečíta **OJ z profilu** a vráti správny skill súbor
4. Asistent odpovie na základe obsahu — priamo, bez zbytočného odkazovania na kolegov

**Poznámka:** `get_skill_context` bude musieť vedieť OJ používateľa. Možnosti:
- a) Odovzdať OJ ako parameter (`get_skill_context('agenda', { oj: 'rcpie' })`) — vyžaduje zmenu tool schémy
- b) Asistent si prečíta profil z kontextu a zavolá `get_skill_context('agenda-rcpie')` — bez zmeny na serveri
- c) Server pozná OJ z emailu (lookup cez Graph API) — bez závislosti na profile

### Čo je potrebné pripraviť

- [ ] `data/skills/agenda/rcpie/skill.md` — Regionálne centrá (porady, výkazy, kľúčové súbory)
- [ ] `data/skills/agenda/ris/skill.md` — RIS (výkazy, reporty, termíny)
- [ ] `data/skills/agenda/huby/skill.md` — HUBY
- [ ] `data/skills/agenda/platformy/skill.md` — Platformy
- [ ] `data/skills/agenda/mapovanie/skill.md` — Mapovanie
- [ ] Capability `/agenda` v `get_capabilities` — `hasContext: true`, detekuje OJ z profilu
- [ ] Obsah skill súborov — **treba získať od vedúcich jednotlivých OJ** (FAQ, kontakty, linky, termíny)

---

## Inovácia Žilinského kraja — `/zsk-review`

Kontextová znalostná báza o súťaži. Používa ju `/mapping` pri práci s firmami prihlásenými do ZSK, ale aj samostatne — napr. keď sa niekto opýta "aké sú kategórie?" alebo "kedy je uzávierka?".

- Web: https://www.inovaciazk.sk/
- Pitch deck guide: https://www.inovaciazk.sk/co-je-to-pitch-deck

### Harmonogram 2026 (18. ročník)

| Dátum | Udalosť |
|---|---|
| 8.1.2026 | Vyhlásenie a otvorenie prihlasovania |
| **24.4.2026** | **Uzavretie prihlasovania** |
| 5.5.2026 | Výber finalistov |
| 12.5.2026 | Finále — Festival inovácií 2026 |

### Kategórie

**1. Inovatívna firma alebo startup**
- Mikropodniky, malé a stredné podniky (< 250 zamestnancov)
- Produkt/služba umiestnená na trhu, inovácia z rokov 2024–2025

**2. Regionálna inovácia**
- Samosprávy, verejné inštitúcie, občianske združenia, neziskovky
- Realizované projekty zavedené do praxe

### Čo obsahuje `data/skills/zsk-review/skill.md`

- Pravidlá a kritériá súťaže
- Štruktúra pitch decku (prevzatá z https://www.inovaciazk.sk/co-je-to-pitch-deck)
- Harmonogram a deadliny
- Kategórie a podmienky účasti

### Prepojenie s `/mapping`

`/mapping` je workflow (research → zápis → formulár). `/zsk-review` je kontext — keď `/mapping` spracováva firmu prihlásenú do ZSK, načíta si aj ZSK pravidlá a pitch deck štruktúru.

### Čo je potrebné pripraviť

- [ ] `data/skills/zsk-review/skill.md` — pravidlá, kategórie, pitch deck štruktúra, harmonogram
- [ ] Prevziať pitch deck štruktúru z https://www.inovaciazk.sk/co-je-to-pitch-deck
- [ ] Skill `/zsk-review` v `get_capabilities` — `hasContext: true`, vracia znalostný kontext
