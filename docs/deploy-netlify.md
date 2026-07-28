# Deploy ASTRA to Netlify (GitHub)

## Option A — Netlify GitHub app (recommended)

1. Sign in at [Netlify](https://app.netlify.com/).
2. **Add new site** → **Import an existing project** → **GitHub** → authorize if prompted.
3. Select repository **`Cpreet/astra-logistics-pwa`**.
4. Netlify reads `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node 20
5. Click **Deploy site**. Production deploys run on every push to `main`.

Your live URL will look like `https://<site-name>.netlify.app` (custom domain optional).

## Option B — GitHub Actions

The workflow `.github/workflows/netlify-deploy.yml` builds on every push to `main` and deploys when these **repository secrets** exist:

| Secret | Where to get it |
|--------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Site settings → General → Site details → **API ID** |

Create an empty site in Netlify first (or use Option A), then add secrets under **GitHub → Settings → Secrets and variables → Actions**.

Re-run the workflow from the **Actions** tab or push to `main`.

## Verify

- `npm run build` succeeds locally.
- Client routes use the SPA redirect in `netlify.toml` (`/*` → `index.html`).
