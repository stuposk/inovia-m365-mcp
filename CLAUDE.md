# inovia-m365-mcp — pokyny pre Claude Code

## Konvencie

- **Názvy MCP nástrojov a skill endpointov sú vždy po anglicky** — napr. `/mapping`, `/zsk-review`, `get_capabilities`, nie `/mapovanie` ani `ziskaj_schopnosti`

## Pred každým buildom a deployom

Vždy pred deployom najprv obnov plugin ZIP (musí byť `.zip`):

```bash
cd plugin && zip -r ../inovia.zip . -x ".DS_Store" "*/.DS_Store" && cd ..
```

Potom build TypeScript:

```bash
npm run build
```

Deploy na Cloud Run — **nepoužívaj `--source .`** (ignoruje Dockerfile, použije Buildpacks).
Namiesto toho:

```bash
PROJECT_ID=cs-poc-dygqbmfisiqcp6qp4ctkddq
IMAGE=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/inovia-m365-mcp:latest

gcloud builds submit --region=europe-west1 --tag=$IMAGE .
gcloud run deploy inovia-m365-mcp --image=$IMAGE --region=europe-west1 --platform=managed --allow-unauthenticated
```

Po deployi nahraj plugin na GitHub Release:

```bash
gh release upload v26.04.01 ./inovia.zip --clobber
```

## Pravidlo: pri každom novom nástroji musia ísť von vždy 3 veci naraz

**README.md je živý dokument** — aktualizuj ho vždy keď sa pridá nový skill, nástroj alebo sa zmení postup pre používateľov. Kontroluj najmä:
- Tabuľku skillov v sekcii "Čo to robí"
- Sekciu "Štruktúra projektu"
- Sekciu "Riešenie problémov" ak pribúdajú nové závislosti (napr. nové API oprávnenia)



Kedykoľvek pridáme nový MCP nástroj (endpoint), **vždy** musia byť súčasťou toho istého releasu:

1. **Server** — nový tool zaregistrovaný v `src/server.ts`, implementácia v `src/tools/` a `src/graph.ts`
2. **Skill pre Claude Code** — `skill/inovia/SKILL.md` (aktualizuj ak sa mení správanie)
3. **Skill pre Cowork plugin** — `plugin/skills/inovia/SKILL.md` (musí byť vždy zhodný s Claude Code verziou)

**Dôležité:** `skill/inovia/SKILL.md` a `plugin/skills/inovia/SKILL.md` musia byť vždy identické — okrem `tools:` frontmatter riadku ktorý je len v plugin verzii. Ak zmeníš jedno, zmeň aj druhé.

Ak pridáš capability s `hasContext: true`:
- Vytvor `data/skills/<id>/guide.md` s detailnými inštrukciami
- Pridaj `get_skill_context` do `tools:` zoznamu v `plugin/skills/inovia/SKILL.md` (ak tam ešte nie je)

Po dokončení: build → deploy → rebuild `inovia.zip` → upload na GitHub Release.

---

## Verzionovanie

Formát: `YY.MM.VV` — rok, mesiac, poradové číslo release v danom mesiaci (2 cifry).
Príklad: `26.04.01` = prvý release v apríli 2026, `26.04.02` = druhý release v apríli.

Pri každom release aktualizuj:
- `package.json` — `version` a `releaseDate`
- `src/server.ts` — `VERSION` konštanta
- `src/tools/capabilities.ts` — `SERVER_VERSION` a `PLUGIN_VERSION` konštanty
- `plugin/.claude-plugin/plugin.json` — `version` + `description` (obsahuje verziu) + `skills` zoznam
- `plugin/skills/inovia/SKILL.md` — verzia v Pravidle 4 (Plugin: X.X.XX)
- `skill/inovia/SKILL.md` — verzia v Pravidle 4 (Plugin: X.X.XX)
- `CHANGELOG.md` — nový záznam
- GitHub Release tag: `vYY.MM.VV`

## Štruktúra projektu

- `src/` — TypeScript zdrojový kód MCP servera
- `plugin/` — Claude Cowork plugin (skills + README)
- `inovia.zip` — ZIP archív pluginu pre GitHub Releases (generovaný, nie commitovať)
- `Dockerfile` — pre Cloud Run deployment

## Dôležité premenné (Cloud Run)

| Premenná | Popis |
|---|---|
| `AZURE_CLIENT_ID` | Azure app registration client ID |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_CLIENT_SECRET` | Azure client secret |
| `SERVICE_URL` | Verejná URL Cloud Run služby |
| `JWT_SECRET` | Secret pre podpisovanie JWT tokenov (30 dní) |
