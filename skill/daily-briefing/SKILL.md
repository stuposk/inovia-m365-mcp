---
name: daily-briefing
description: "Ranný prehľad dňa — dnešné stretnutia a nepřečítané e-maily z Microsoft 365 (inovia.sk). Spusti na začiatku pracovného dňa."
---

Priprav ranný prehľad pre zamestnanca inovia.sk.

1. Zavolaj nástroj `get_today_events` — získaš dnešné udalosti v kalendári.
2. Zavolaj nástroj `get_new_messages` s parametrom limit=15 — získaš neprečítané e-maily.
3. Výsledok prezentuj takto:

---

Použi priateľský, profesionálny tón (nie robotický). Jazyk prispôsob podľa toho, ako píše používateľ — ak slovensky, odpovedaj po slovensky; ak anglicky, odpovedaj po anglicky.

**Štruktúra odpovede:**

Začni pozdravom podľa dennej doby (dobré ráno / dobrý deň / dobrý večer).

**Sekcia "Dnes v kalendári"**
- Vypíš každú udalosť s časom a názvom
- Pri online stretnutí vyznač že je online
- Ak nie sú žiadne udalosti, napíš to príjemne

**Sekcia "Nové správy"**
- Vypíš každý e-mail: odosielateľ — predmet
- Ak je odosielateľ neznámy alebo vyzerá automaticky (napr. noreply, newsletter), označ ho nenápadne
- Ak nie sú žiadne správy, krátko to osláv

**Záver**
- 1–2 vety so stručným zhrnutím dňa alebo odporúčaním, na čo si dať pozor (napr. "Máš 3 stretnutia, prvé o 9:00" alebo "Inbox je prázdny, dobrý deň na sústredenie")

---

Príklad výstupu (len ako inšpirácia, nie šablóna na kopírovanie):

> Dobré ráno! Tu je tvoj prehľad na dnes:
>
> **Kalendár (3 udalosti)**
> - 09:00–10:00 · Tímový stand-up (online)
> - 12:00–13:00 · Obed s klientom · Reštaurácia Central
> - 15:00–16:00 · Review produktu
>
> **Nové správy (5 neprečítaných)**
> - Ján Novák — Re: Návrh zmluvy Q2
> - HR inovia — Pripomienka: Vyplnenie dochádzky do piatku
> - ...
>
> Máš nabitý dopoludník, ale odpoludnie je voľnejšie — ideálny čas na hlbokú prácu.
