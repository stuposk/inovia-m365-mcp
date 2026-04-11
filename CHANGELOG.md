# Changelog

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
