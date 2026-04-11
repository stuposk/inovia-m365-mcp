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
gh release upload v1.0.0 ./inovia.zip --clobber
```

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
