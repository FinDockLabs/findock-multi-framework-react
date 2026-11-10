# Donation page: plain HTML + Lightning Out

A charity website in plain HTML, CSS and JavaScript (no framework, no build step) with FinDock's Salesforce
**Donation_Flow** embedded through **Lightning Out 2.0**. The page is yours; the form is the flow, running in
Salesforce and styled from Salesforce.

Fictional charity: **Canopy Gibbon Trust**. The header pill reads "Lightning Out on Netlify" on the demo site.

## How it works

```
your website (any host)                          Salesforce (your org)
┌────────────────────────────┐                   ┌──────────────────────────────────────────┐
│ index.html                 │  Lightning Out    │ Lightning Out site (/lightningout)       │
│  └ #donate-embed           │ ────────────────▶ │  └ c-donation-flow (wrapper LWC)         │
│     lightning-out-         │   iframe          │     └ Donation_Flow (screen flow)        │
│     application +          │ ◀──────────────── │        └ FinDock payment components      │
│     <c-donation-flow>      │  postMessage:     │                                          │
│                            │  height, redirect │                                          │
└────────────────────────────┘                   └──────────────────────────────────────────┘
```

- `donate.js` calls `embedLightningOut()` from `shared/lightning-out-embed.js`: it adds the
  `<lightning-out-application>` and `<c-donation-flow>` tags, loads the runtime, sizes the frame to the flow and
  follows redirects to hosted payment pages (iDEAL, PayPal).
- The flow sends donors back to `thank-you.html` or `payment-failed.html` after a hosted payment.
- `shared/` is a copy of the repo's `/shared` folder (brand CSS, page layout CSS, images, the embed module).
  Don't edit it here; edit `/shared` and run `npm run sync-shared` in the repo root.

| File | What it is |
|---|---|
| `index.html` | The campaign page: header, hero with the form card, cards, quote, FAQ, footer |
| `donate.js` | Starts the embed and the loading skeleton |
| `config.js` | Your org's Lightning Out settings (see below) |
| `thank-you.html`, `payment-failed.html` | Return pages after a hosted payment |
| `shared/` | Copied from `/shared`: `canopy/tokens.css`, `canopy/site.css`, images, `lightning-out-embed.js` |

## Prerequisites

The Salesforce side, once per org: see [salesforce/README.md](../../salesforce/README.md). You need a
Lightning Out site, the Lightning Out app with `c-donation-flow`, and the Donation_Flow.

## Configure

Edit `config.js`:

| Setting | Where to find it |
|---|---|
| `orgUrl` | Your Experience Cloud domain, e.g. `https://acme.my.site.com` (Setup › Digital Experiences › Settings) |
| `runtimeUrl` | `https://<your My Domain>.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js` |
| `sitePrefix` | URL prefix of your Lightning Out site, e.g. `lightningout` |
| `appId` | Setup › Lightning Out 2.0 Apps › your app, the Id starting with `1Us` |

## Run locally

Any static file server works. From the repo root:

```bash
npm run serve:html-donation
```

The form only loads on an origin your org trusts (see "Trust your website" below), so add your local URL, or test
on a deployed preview.

## Deploy

The folder is a finished static site: publish it as-is, with no build step. Then trust its address in Salesforce.

### Netlify

- **CLI:** `npx netlify-cli deploy --dir examples/html-lightning-out-donation --prod`
- **Git:** New site › import the repository › Base directory `examples/html-lightning-out-donation`,
  Build command empty, Publish directory `.` (relative to the base directory).
- **Drag and drop:** drop the folder on app.netlify.com/drop.

### Vercel

- **CLI:** `cd examples/html-lightning-out-donation && npx vercel --prod`. Answer "Other" for the framework and
  leave the build command empty.
- **Git:** Add New › Project › import the repository › Root Directory `examples/html-lightning-out-donation`,
  Framework Preset "Other", no build command, Output Directory `.`.

### Cloudflare Pages

- **CLI:** `npx wrangler pages deploy examples/html-lightning-out-donation --project-name canopy-donate`
- **Git:** Create a project › connect the repository › Build command empty, Build output directory
  `examples/html-lightning-out-donation`.

### GitHub Pages

Publish the folder with an Actions workflow (`actions/upload-pages-artifact` with
`path: examples/html-lightning-out-donation`, then `actions/deploy-pages`). GitHub Pages serves the site under
`/<repository>/`; the example uses relative links, so that works.

### Your own web server

Copy the folder's contents to the web root (or any subfolder) of Apache, nginx, IIS, S3 + CloudFront, and so on.
Serve `.js` files as `text/javascript` (they're ES modules).

### Trust your website in Salesforce

Lightning Out only renders inside sites the org trusts. For each address you deploy to (production, previews,
`http://localhost:3000` for local testing), add it in Salesforce:

1. **Lightning Out site** (Experience Builder › Settings › Security & Privacy):
   - Trusted Domains for Inline Frames (the `frame-ancestors` list),
   - Trusted Sites for Scripts.
2. **Setup › CSP Trusted Sites:** the address, all directives (example: `salesforce/.../cspTrustedSites`).
3. **Setup › CORS:** the address as an allowed origin (example: `salesforce/.../corsWhitelistOrigins`).
4. **Setup › Session Settings › Trusted Domains for Inline Frames:** the address, iframe type "Lightning Out".
5. Publish the Lightning Out site.

Preview deployments (Netlify deploy previews, Vercel preview URLs) get a new address each time: trust a wildcard
for your team's preview domain, or test on a fixed staging address.

## Styling

- The page: `shared/canopy/tokens.css` (colours, fonts) and `shared/canopy/site.css` (layout).
- The form: styled in Salesforce by the `canopyStyles` static resource, which the Lightning Out site loads. Lightning
  Out doesn't pass your page's CSS into the frame. See
  [Payment Experiences styling](https://docs.findock.com/docs/november-26/payments/payment-experiences-styling).
