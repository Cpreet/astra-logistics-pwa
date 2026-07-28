# Deploy ASTRA to Netlify (GitHub)

## Option A — Netlify GitHub app (recommended)

1. Sign in at [Netlify](https://app.netlify.com/).
2. **Add new site** → **Import an existing project** → **GitHub** → authorize if prompted.
3. Select repository `Cpreet/astra-logistics-pwa`.
4. Netlify reads `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node 20
5. Deploy. Production deploys run on pushes to `main`.

## Option B — GitHub Actions

If you use `.github/workflows/netlify-deploy.yml`, add repository secrets:

| Secret | Where to get it |
|--------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Site settings → General → Site details → API ID |

Push to `main` or run the workflow manually under **Actions**.

## Verify

- `npm run build` succeeds locally.
- Client routes use the SPA redirect in `netlify.toml` (`/*` → `index.html`).
