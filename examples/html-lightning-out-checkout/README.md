# Customer portal: plain HTML + Lightning Out

A customer portal in plain HTML, CSS and JavaScript where customers see their invoices and pay one, with FinDock's
Salesforce **Pay_Link_Flow** embedded through **Lightning Out 2.0**: the same invoice card as the Pay Link template.
Each invoice is a FinDock installment; the portal passes its GUID to the flow.

Fictional company: **Your company**, the neutral brand of the Experience Cloud checkout and Pay Link templates.

| File | What it is |
|---|---|
| `index.html`, `portal.js` | Invoice list with status, totals and "Pay now" buttons. Warms up the pay link in the background (Salesforce starts a flow slowly when its cache is cold) |
| `pay.html`, `pay.js` | Pay page: the invoice card (`c-pay-link-flow`) for `?invoice=<installment GUID>&ref=<INST-number>`, with the invoice PDF as a thumbnail |
| `thank-you.html` | Return page after payment; marks the invoice as paid in this browser (demo only) |
| `config.js` | Your org's Lightning Out settings |
| `invoices/` | Sample invoice PDFs. Their QR code opens the [Pay Link example](../html-lightning-out-pay-link) |
| `shared/lightning-out-embed.js` | Copy of `/shared/lightning-out/lightning-out-embed.js` (run `npm run sync-shared` in the repo root after editing the original) |
| `styles.css` | The portal's own look, in the neutral brand of the templates |
| `shared/example-bar.js` | The demo's "Example" bar. Remove its `<script>` line from the HTML on your own site |

The invoice rows in `index.html` are sample data with installment GUIDs from the demo org. Replace them with your own
installments, or load them from your backend.

## Prerequisites

The Salesforce side, once per org: see [salesforce/README.md](../../salesforce/README.md). You need a Lightning Out
site, the Lightning Out app with `c-pay-link-flow`, and the Pay Link Flow.

## Configure

Edit `config.js` (same settings as the donation example):

| Setting | Where to find it |
|---|---|
| `orgUrl` | Your Experience Cloud domain, e.g. `https://acme.my.site.com` |
| `runtimeUrl` | `https://<your My Domain>.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js` |
| `sitePrefix` | URL prefix of your Lightning Out site, e.g. `lightningout` |
| `appId` | Setup › Lightning Out 2.0 Apps › your app, the Id starting with `1Us` |

## Run locally

```bash
npm run serve:html-checkout
```

## Deploy

A finished static site: publish the folder as-is.

| Host | How |
|---|---|
| Netlify | `npx netlify-cli deploy --dir examples/html-lightning-out-checkout --prod`, or Git import with base directory `examples/html-lightning-out-checkout`, no build command |
| Vercel | `cd examples/html-lightning-out-checkout && npx vercel --prod` (framework "Other", no build command), or Git import with Root Directory `examples/html-lightning-out-checkout` |
| Cloudflare Pages | `npx wrangler pages deploy examples/html-lightning-out-checkout --project-name findock-portal` |
| GitHub Pages | Actions workflow uploading `examples/html-lightning-out-checkout` (relative links work under `/<repository>/`) |
| Your own server | Copy the folder to the web root; serve `.js` as `text/javascript` |

Then trust the site's address in Salesforce, exactly as for the donation example:
[Trust your website in Salesforce](../html-lightning-out-donation/README.md#trust-your-website-in-salesforce).

## Styling

The portal uses `styles.css`. The invoice card inside the frame is styled in Salesforce by the `payLinkStyles` static
resource, which `c-pay-link-flow` loads itself.
