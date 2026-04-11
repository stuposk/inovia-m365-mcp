# inovia-m365-mcp — pokyny pre Claude Code

## Pred každým buildom a deployom

Vždy pred `npm run build` alebo `gcloud run deploy` najprv obnov plugin súbor:

```bash
cd plugin && zip -r ../inovia-m365.plugin . -x ".*" "*/.*" && cd ..
```

Potom build a deploy:

```bash
npm run build
gcloud run deploy inovia-m365-mcp --source . --region europe-west1 --platform managed --allow-unauthenticated
```

## Štruktúra projektu

- `src/` — TypeScript zdrojový kód MCP servera
- `plugin/` — Claude Cowork plugin (skills + README)
- `inovia-m365.plugin` — ZIP archív pluginu pre GitHub Releases (generovaný, nie commitovať)
- `Dockerfile` — pre Cloud Run deployment

## Dôležité premenné (Cloud Run)

| Premenná | Popis |
|---|---|
| `AZURE_CLIENT_ID` | Azure app registration client ID |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_CLIENT_SECRET` | Azure client secret |
| `SERVICE_URL` | Verejná URL Cloud Run služby |
| `JWT_SECRET` | Secret pre podpisovanie JWT tokenov (30 dní) |
