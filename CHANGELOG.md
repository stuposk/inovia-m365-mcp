# Changelog

## 26.04.15 — 2026-04-12

### Zmenené
- CLAUDE.md: pravidlo — názvy nástrojov a endpointov vždy po anglicky
- Roadmap: /mapping + /zsk-review ako samostatné skilly
- gitignore: .DS_Store

---

## 26.04.14 — 2026-04-12

### Zmenené
- Marketing capability zjednotená s ostatnými — používa `get_skill_context('marketing')` namiesto samostatného `get_marketing_guide` toolu
- `data/marketing/guide.md` presunutý do `data/skills/marketing/guide.md`
- Zrušený `get_marketing_guide` tool a `src/tools/marketing.ts`
- SKILL.md: odstránený `get_marketing_guide` z tools zoznamu

---

## 26.04.13 — 2026-04-12

### Zmenené
- Auth callback: pekná error stránka namiesto raw JSON od Microsoftu (expired code, access denied, atď.)
- Priateľské slovenské chybové hlásenia s tlačidlom "Skúsiť znova"
- Skill: Pravidlo 3 — lokálny súbor `moje-instrukcie.md` má prednosť pred serverom
- Skill: asistent vedie používateľov k priebežnému vylepšovaniu lokálneho súboru
- Daily briefing: spätná väzba raz za týždeň (v pondelok) namiesto každý deň
- Onboarding: krok 6 — vytvorenie `moje-instrukcie.md` v priečinku Inovia

---

## 26.04.12 — 2026-04-11

### Zmenené
- `setup` capability premenovaná na `onboarding`
- Onboarding guide rozšírený o Časť 2 — Osobné preferencie (emoji, formátovanie, jazyk...)
- `get_capabilities` vracia `serverVersion` + `pluginVersion`
- Skill: Krok 1 — odstránená zmienka o `currentUser.email` (zbytočná)
- Skill: Pravidlo 3 — každá odpoveď musí končiť `Plugin: X · Server: Y`
- Vytvorený `data/onboarding/template.md` — prázdna šablóna profilu na serveri

---

## 26.04.11 — 2026-04-12

### Zmenené
- Skill: Krok 0 — bez profilu v Project Instructions sa služby neposkytujú, len setup
- Plugin a Claude Code SKILL.md zjednotené

---

## 26.04.10 — 2026-04-12

### Pridané
- `setup` capability — onboarding profilu používateľa (meno, OJ, pozícia, lokalita, skratka)
- `data/skills/setup/guide.md` — zoznam OJ a pozícií, generovanie skratky (MiSt), výstup pre Cowork Project Instructions
- `get_capabilities` vracia `currentUser.email` — email predvyplnený pri onboardingu

---

## 26.04.09 — 2026-04-12

### Zmenené
- Skill `/inovia`: Krok 2 explicitne spracúva `hasContext` — ak `true`, zavolá `get_skill_context(id)` pred konaním

---

## 26.04.08 — 2026-04-12

### Zmenené
- Konvencia pre data súbory: `data/<topic>/guide.md` — zjednotené s marketing štruktúrou
- `data/skills/daily-briefing.md` → `data/skills/daily-briefing/guide.md`

---

## 26.04.07 — 2026-04-12

### Pridané
- `get_skill_context(id)` tool — Claude načíta detailné inštrukcie z `data/skills/<id>.md`
- `data/skills/daily-briefing.md` — obnovené detailné inštrukcie pre ranný prehľad
- Capabilities: príznak `hasContext: true` pre capability s kontextovým súborom

---

## 26.04.06 — 2026-04-12

### Zmenené
- Skill `/inovia`: pred každým zápisom (udalosť, email...) sa Claude musí opýtať na potvrdenie
- Skill `/inovia`: zosilnený zákaz Google Kalendára a iných externých nástrojov

---

## 26.04.05 — 2026-04-12

### Zmenené
- Skill `/inovia`: explicitná inštrukcia používať výlučne `mcp__inovia-m365__*` nástroje, nikdy Google Kalendár ani iné externé zdroje

---

## 26.04.04 — 2026-04-12

### Zmenené
- Auth callback stránka: krok 4 zmenený z "ranný prehľad" na `/inovia` so zoznamom funkcií

---

## 26.04.03 — 2026-04-12

### Zmenené
- Vylepšený `/inovia` skill — jasnejšia inštrukcia: vždy najprv `get_capabilities`, potom uvažuj o zámere a konaj
- Vylepšené `prompt` polia v `get_capabilities` — konkrétnejšie inštrukcie pre Claude

---

## 26.04.02 — 2026-04-12

### Pridané
- Generický `/inovia` skill nahradil samostatné skilly — plugin sa nebude musieť aktualizovať pri každom novom nástroji
- `get_capabilities` tool — server dynamicky vracia zoznam dostupných funkcií s promptmi
- `get_marketing_guide` tool — číta `data/marketing/guide.md` a vracia obsah s verziou
- Marketingový komunikačný manuál INOVIA v1.0 (tone of voice, blacklist, LLM prompt)
- Nový dizajn auth callback stránky (card layout, Powered by Unite)

### Zmenené
- Plugin obsahuje jediný skill `inovia` namiesto `daily-briefing` + `find-colleague`

---

## 26.04.01 — 2026-04-11

### Pridané
- Remote server s Microsoft OAuth autorizáciou (Google Cloud Run)
- Per-user JWT session tokeny (platnosť 30 dní), token v URL (`?token=...`)
- Onboarding flow — Claude prevedie novým používateľom prihlásením
- Claude Cowork plugin (`inovia.zip`) so skill-om `/daily-briefing`
- `get_today_events` — kalendárne udalosti pre ľubovoľný dátumový rozsah
- `get_new_messages` — neprečítané e-maily z inboxu
- `find_colleague` — vyhľadávanie kolegu podľa mena, emailu alebo oddelenia
- `get_department_members` — zoznam členov oddelenia
- `get_org_chart` — manažér a priame podriadené pre ľubovoľného kolegu
