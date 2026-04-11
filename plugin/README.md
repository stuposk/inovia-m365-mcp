# inovia-m365 Plugin

Microsoft 365 integrácia pre Claude Cowork — ranný prehľad dňa, kalendár a e-maily pre zamestnancov INOVIA.sk.

## Čo plugin obsahuje

**Skill: Ranný prehľad (daily-briefing)**
Načíta dnešné stretnutia z Outlooku a neprečítané e-maily. Spusti napísaním „ranný prehľad" alebo „čo mám dnes".

**MCP server: inovia-m365**
Napojenie na Microsoft 365 cez remote server na Google Cloud Run.

## Inštalácia

1. Nainštaluj plugin v Claude Cowork
2. Napíš čokoľvek — Claude ťa prevedie prihlásením

## Prvé prihlásenie

Po inštalácii pri prvom použití Claude automaticky vysvetlí, čo treba spraviť:

1. Otvor odkaz `https://inovia-m365-mcp-521967815165.europe-west1.run.app/auth/login` v prehliadači
2. Prihlás sa svojím `@inovia.sk` Microsoft účtom
3. Skopíruj svoju osobnú URL adresu MCP servera
4. V Cowork: Nastavenia → MCP servery → vlož URL (nahradí pôvodnú)

Platnosť prihlásenia je **30 dní**. Po vypršaní sa vráť na krok 1.

## Plánované rozšírenia

Pozri [ROADMAP.md](https://github.com/stuposk/inovia-m365-mcp/blob/main/ROADMAP.md)

## Zdroj

[github.com/stuposk/inovia-m365-mcp](https://github.com/stuposk/inovia-m365-mcp)
