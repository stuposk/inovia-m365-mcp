# Roadmap — inovia-m365-mcp

Prehľad plánovaných funkcií zoskupených podľa oblasti. Aktuálne implementované funkcie sú označené ✅.

---

## Infraštruktúra

- ✅ Remote server s Microsoft OAuth autorizáciou (Cloud Run)
- ✅ Per-user JWT session tokeny (30 dní)
- ✅ Onboarding flow — Claude prevedie novým používateľom prihlásením
- ✅ Claude Cowork plugin (`inovia.zip`)

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

| Skill | Čo robí | Závisí od |
|---|---|---|
| `/daily-briefing` | Ranný prehľad — kalendár + neprečítané maily | ✅ hotové |
| `/find-colleague` | Vyhľadá kolegu, zobrazí kontakt a org chart | ✅ hotové |
| `/mail-review` | Prečíta dnešné maily, zhrnie každý, navrhne odpovede | celý obsah mailu |
| `/send-reply` | Odošle pripravenú odpoveď na konkrétny mail | Mail.Send |
| `/schedule-meeting` | Naplánuje stretnutie s kolegom (skontroluje free/busy) | free/busy, vytvorenie udalosti |
| `/weekly-prep` | Prehľad týždňa — stretnutia + nevybavené maily | týždenný kalendár |

---

## Posúdenie inovačných projektov (ZSK)

Pracovný postup pre spracovanie prezentácií firiem a vyplnenie hodnotiacich formulárov.

### Fázy

1. **Príjem a prieskum firmy**
   - Nahranie prezentácie firmy (PDF / PPTX) do priečinka Inovia
   - Research o firme — web, LinkedIn, verejné zdroje
   - Extrahovanie kľúčových údajov: produkt, tím, trh, trakcia, financovanie

2. **Spracovanie záznamu**
   - Štruktúrovaný zápis zo stretnutia / prezentácie podľa šablóny INOVIA
   - Identifikácia silných stránok, rizík, inovačného potenciálu
   - Porovnanie s predchádzajúcimi projektmi (ak sú k dispozícii)

3. **Vyplnenie formulára**
   - Načítanie otázok z hodnotiaceho formulára ZSK (nahrať ako súbor)
   - Automatické mapovanie údajov z záznamu na jednotlivé otázky formulára
   - Návrh odpovedí s možnosťou úpravy pred potvrdením

### Čo je potrebné pripraviť

- [ ] Šablóna záznamu zo stretnutia (`data/skills/zsk-review/guide.md`)
- [ ] Hodnotiaci formulár ZSK ako referenčný súbor (otázky a typy polí)
- [ ] Skill `/zsk-review` — orchestruje celý postup (príjem → research → zápis → formulár)
- [ ] Podpora čítania PDF/PPTX súborov z priečinka Inovia (cez Context)
