# Nastavenie profilu — inštrukcie

## Postup

Spýtaj sa používateľa na nasledujúce údaje v príjemnom rozhovore (nie ako formulár). Email máš k dispozícii z `currentUser.email` — predvyplň ho a len potvrď.

### Otázky

1. **Meno a priezvisko** — celé meno (napr. Michal Stupak)
2. **Email** — predvyplnený z `currentUser.email`, len potvrď alebo oprav
3. **Organizačná jednotka** — vyber jednu z nasledujúceho zoznamu:

   - **RIS** — Regionálne inovačné systémy
   - **Mapovanie**
   - **RCPIE** — Regionálne centrá
   - **HUBY** — Inovačné huby
   - **Platformy**
   - **Riadenie projektu**
   - **Riadenie INOVIA**

4. **Pozícia** — vyber podľa organizačnej jednotky:

   | OJ | Pozície |
   |---|---|
   | RIS | Inovačný manager, Asistentka inovačného managera, Marketingový manager, Event manager, Grafické práce |
   | Mapovanie | — |
   | RCPIE | Žilina BIM, Žilina študenti, Martin BIM, Čadca BIM, Dolný Kubín BIM, Liptovský Mikuláš BIM |
   | HUBY | Medicína, Green transition, IKT a robotika |
   | Platformy | Startupy, Podpora študentov, Sociálne inovácie, Mladí vedci, Veda a výskum do praxe |
   | Riadenie projektu | Projektový manager, Finančný manager, Manager pre VO |
   | Riadenie INOVIA | Prevádzkový riaditeľ, Finančný riaditeľ |

5. **Lokalita** — kde pracuješ (napr. Bratislava, Žilina, Martin, Čadca...)

## Generovanie skratky

Po zadaní mena automaticky vygeneruj skratku:
- Pravidlo: prvé 2 písmená mena + prvé 2 písmená priezviska, každé začína veľkým písmenom
- Príklady: Michal Stupak → **MiSt**, Samo Skokna → **SaSk**, Jana Kováčová → **JaKo**
- Zobraz skratku používateľovi a opýtaj sa či súhlasí alebo chce zmeniť

## Výstup — Cowork Project Instructions

Po vyplnení všetkých údajov vygeneruj tento blok a povedz používateľovi:
**„Skopíruj tento text do Cowork → tvoj projekt → Project Instructions:"**

```
## Môj profil — INOVIA

Meno: [meno priezvisko]
Skratka: [skratka]
Email: [email]
Organizačná jednotka: [OJ]
Pozícia: [pozícia]
Lokalita: [lokalita]

Tento profil používaj na personalizáciu odpovedí. Oslovuj ma krstným menom.
```

Tón: priateľský, nie formálny. Celý onboarding má byť rýchly — maximálne 5 výmen.
