# Roadmap — inovia-m365-mcp

Prehľad plánovaných funkcií zoskupených podľa oblasti. Aktuálne implementované funkcie sú označené ✅.

---

## #1 — Remote server s Microsoft OAuth autorizáciou

Priorita: **vysoká** — predpoklad pre nasadenie pre celý tím.

Aktuálne beží server lokálne na počítači každého používateľa. Cieľom je presunutie na zdieľaný remote server (napr. Azure App Service), kde každý kolega uvidí len svoje vlastné dáta.

**Čo treba spraviť:**
- [ ] Pridať HTTP/SSE transport do MCP servera (aktuálne len stdio)
- [ ] Pridať Microsoft OAuth flow — kolega sa prihlási svojim `@inovia.sk` účtom
- [ ] Server overí Microsoft token a použije email z tokenu (nie z `.env`)
- [ ] Nasadiť na Azure App Service
- [ ] Aktualizovať README s inštrukciami pre pripojenie cez Cowork (URL miesto lokálnej cesty)

**Výsledok:** Kolegovia si nainštalujú Claude Cowork, zadajú URL servera, prihlásia sa Microsoft účtom → hotovo. Žiadna inštalácia Node.js, žiadny terminál.

---

## Kalendár (`Calendars.ReadWrite`)

- ✅ Zobraziť dnešné stretnutia (`/daily-briefing`)
- [ ] Zobraziť týždenný prehľad stretnutí
- [ ] Vytvoriť udalosť / pozvánku
- [ ] Presunúť alebo zrušiť stretnutie
- [ ] Skontrolovať, či kolegovia majú voľný čas (free/busy)
- [ ] Navrhnúť optimálny čas stretnutia pre viacerých ľudí

## Maily — čítanie (`Mail.Read`, `Mail.ReadWrite`)

- ✅ Zobraziť neprečítané e-maily (`/daily-briefing`)
- [ ] Prečítať celý obsah mailu (nie len náhľad)
- [ ] Vyhľadať maily podľa odosielateľa / témy / dátumu
- [ ] Označiť maily ako prečítané
- [ ] Presunúť mail do priečinka / archivácia

## Maily — písanie a odosielanie (`Mail.ReadWrite`, `Mail.Send`)

- [ ] Pripraviť návrh odpovede na mail
- [ ] Odoslať odpoveď priamo z Claude Code
- [ ] Vytvoriť nový mail (draft alebo rovno odoslať)
- [ ] Hromadná odpoveď na sériu mailov v jednom vlákne

## Používatelia (`User.Read.All`)

- [ ] Vyhľadať kolegu podľa mena → zistiť jeho e-mail
- [ ] Zobraziť org chart / kto komu reportuje
- [ ] Automaticky doplniť príjemcov podľa mena

---

## Plánované skill-y

| Skill | Čo robí | Závisí od |
|---|---|---|
| `/daily-briefing` | Ranný prehľad — kalendár + neprečítané maily | ✅ hotové |
| `/mail-review` | Prečíta dnešné maily, zhrnie každý, navrhne odpovede | celý obsah mailu, označiť ako prečítané |
| `/send-reply` | Odošle pripravenú odpoveď na konkrétny mail | Mail.Send nástroj |
| `/schedule-meeting` | Naplánuje stretnutie s kolegom (skontroluje free/busy) | free/busy, vytvorenie udalosti |
| `/weekly-prep` | Prehľad týždňa — stretnutia + nevybavené maily | týždenný kalendár |
| `/find-colleague` | Vyhľadá e-mail/kontakt podľa mena | User.Read.All nástroj |
