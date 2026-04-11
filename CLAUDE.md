# inovia-m365-mcp — pokyny pre Claude Code

## Pred každým buildom a deployom

Vždy pred deployom najprv obnov plugin ZIP (musí byť `.zip`):

```bash
cd plugin && zip -r ../inovia.zip . -x ".*" "*/.*" && cd ..
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
2. **Skill pre Claude Code** — nový `skill/<nazov>/SKILL.md`
3. **Skill pre Cowork plugin** — nový `plugin/skills/<nazov>/SKILL.md` (s `tools:` frontmatter)

Po dokončení: build → deploy → rebuild `inovia.zip` → upload na GitHub Release.

---

## Verzionovanie

Formát: `YY.MM.VV` — rok, mesiac, poradové číslo release v danom mesiaci (2 cifry).
Príklad: `26.04.01` = prvý release v apríli 2026, `26.04.02` = druhý release v apríli.

Pri každom release aktualizuj:
- `package.json` — `version` a `releaseDate`
- `src/server.ts` — `VERSION` konštanta
- `plugin/.claude-plugin/plugin.json` — `version` + `skills` zoznam
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
