# Donation page: React (Multi-Framework) + Lightning Out

A React donation page built as a **Salesforce Multi-Framework UI bundle** and hosted on an Experience Cloud site,
with FinDock's **Donation_Flow** embedded through **Lightning Out 2.0**. Same page as the
[plain-HTML example](../html-lightning-out-donation), built in React and served by Salesforce.

| Path | What it is |
|---|---|
| `force-app/main/default/uiBundles/DonateLightningOut/` | The React + Vite + TypeScript app |
| `…/src/pages/Donate.tsx` | Page sections from `/shared/react/canopy.tsx` plus `<LightningOutEmbed component="c-donation-flow">` |
| `…/src/config.ts` | Lightning Out settings |
| `…/scripts/fetch-lightning-out.mjs` | Downloads the Lightning Out runtime into the app at build time (see "Why the runtime is bundled") |
| `force-app/main/default/networks`, `sites`, `digitalExperienceConfigs`, `digitalExperiences` | The `Donate Lightning Out` Experience site that hosts the app at `/donatelo` |

The app imports `/shared` (page sections, brand CSS, `LightningOutEmbed`) through the Vite alias `@shared`.

## Why it works without trust settings

The app and the Lightning Out site are on the same Experience Cloud domain, so the flow is framed from the page's own
origin: `frame-ancestors 'self'` already allows it, and no CSP Trusted Sites, CORS or iframe settings are needed.

## Why the runtime is bundled

A React (Multi-Framework) site only allows scripts from its own domain. CSP Trusted Sites have no script setting,
and React sites don't support the "Trusted Sites for Scripts" site setting. So `npm run build` first downloads
`lightning.out.latest/index.iife.prod.js` from your My Domain into `public/lightning-out/` (not committed), and the
app serves it itself. Rebuild and redeploy to pick up a newer Lightning Out runtime.

## Prerequisites

- The Salesforce side for Lightning Out, once per org: [salesforce/README.md](../../salesforce/README.md).
- Multi-Framework (React) and Digital Experiences enabled in the org.

## Configure

```bash
cd force-app/main/default/uiBundles/DonateLightningOut
cp .env.example .env
```

| Variable | Value |
|---|---|
| `VITE_SALESFORCE_MY_DOMAIN` | `https://<your My Domain>.my.salesforce.com` (the build downloads the runtime from here) |
| `VITE_LIGHTNING_OUT_APP_ID` | Setup › Lightning Out 2.0 Apps › your app, the Id starting with `1Us` |
| `VITE_LIGHTNING_OUT_SITE_PREFIX` | URL prefix of your Lightning Out site, default `lightningout` |

## Deploy

This app runs on Salesforce, not on Netlify or Vercel: the UI bundle is deployed as metadata and served by the
Experience site.

```bash
# 1. Build the app (downloads the Lightning Out runtime, then vite build → dist/)
(cd force-app/main/default/uiBundles/DonateLightningOut && npm install && npm run build)

# 2. Deploy the UI bundle
sf project deploy start -o <alias> -d force-app/main/default/uiBundles

# 3. Deploy the Experience site that hosts it
sf project deploy start -o <alias> -d force-app/main/default/networks -d force-app/main/default/sites \
  -d force-app/main/default/digitalExperienceConfigs -d force-app/main/default/digitalExperiences

# 4. Publish
sf community publish -o <alias> --name "Donate Lightning Out"
```

The page is then served at `https://<my-domain>.my.site.com/donatelo/`. The site needs no guest permissions of its
own: the flow runs in the Lightning Out site, which has the FinDock guest setup.

The site's URL prefix must be letters and digits only (`donatelo`, not `donate-lo`).

### Hosting the React app outside Salesforce instead

Want the same React page on Netlify or Vercel? Build it as a normal Vite app (drop the
`@salesforce/vite-plugin-ui-bundle` plugin), load the runtime straight from your My Domain, set `orgUrl` to your
Experience Cloud domain, and trust the host's address as described in
[Trust your website in Salesforce](../html-lightning-out-donation/README.md#trust-your-website-in-salesforce).
That is exactly what the plain-HTML example does.
