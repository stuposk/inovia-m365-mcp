---
name: daily-briefing
description: Ranný prehľad dňa pre zamestnancov INOVIA.sk — dnešné stretnutia z Outlooku a neprečítané e-maily z Microsoft 365. Spusti na začiatku pracovného dňa. Triggers: "ranný prehľad", "čo mám dnes", "daily briefing", "čo ma dnes čaká", "rozcvička", "prehľad dňa".
tools: [mcp__inovia-m365__get_today_events, mcp__inovia-m365__get_new_messages]
---

Vykonaj nasledovné kroky v poradí:

1. Zavolaj `get_today_events` bez parametrov — načíta dnešné udalosti z Outlook kalendára.
2. Zavolaj `get_new_messages` s parametrom `limit=15` — načíta neprečítané e-maily z inboxu.
3. Prezentuj výsledky v tomto formáte:

**Pozdrav** — použi čas-primeraný pozdrav (dobré ráno pred 12:00, dobrý deň poobede, dobrý večer večer).

**Kalendár** — vymenuj udalosti s presným časom a názvom. Označ Teams stretnutia slovom "(online)". Ak nie sú žiadne udalosti, elegantne to poznamenej.

**E-maily** — každý e-mail zobraz ako "meno odosielateľa — predmet správy". Jemne upozorni na automatické notifikácie alebo neznámych odosielateľov. Ak je inbox prázdny, oslávte to.

**Záver** — 1–2 vety: krátky súhrn dňa alebo užitočná perspektíva (napr. ak je veľa stretnutí, upozorni na bloky na sústredenie).

Jazyk: odpovedaj v jazyku používateľa — slovensky ak píše po slovensky, anglicky ak píše po anglicky.
Tón: priateľský a profesionálny, nie robotický.
