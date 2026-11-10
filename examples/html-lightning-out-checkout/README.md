# Invoice checkout: plain HTML + Lightning Out

A customer portal in plain HTML, CSS and JavaScript where customers see their invoices and pay one, with FinDock's
Salesforce **Checkout_Flow** embedded through **Lightning Out 2.0**. Each invoice is a FinDock installment; the
portal passes its GUID to the flow.

Fictional company: **FinDock Gibbons**.

| File | What it is |
|---|---|
| `index.html`, `portal.js` | Invoice list with status, totals and "Pay now" buttons. Warms up the checkout in the background (Salesforce starts a flow slowly when its cache is cold) |
| `pay.html`, `pay.js` | Pay page: invoice details and the embedded checkout for `?invoice=<installment GUID>&ref=<INST-number>` |
| `thank-you.html` | Return page after payment; marks the invoice as paid in this browser (demo only) |
| `config.js` | Your org's Lightning Out settings |
| `invoices/` | Sample invoice PDFs |
| `shared/lightning-out-embed.js` | Copy of `/shared/lightning-out/lightning-out-embed.js` (run `npm run sync-shared` in the repo root after editing the original) |
| `styles.css` | The portal's own look (navy FinDock style; this example doesn't use the Canopy brand) |

The invoice rows in `index.html` are sample data with installment GUIDs from the demo org. Replace them with your own
installments, or load them from your backend.

## Prerequisites

The Salesforce side, once per org: see [salesforce/README.md](../../salesforce/README.md). You need a Lightning Out
site, the Lightning Out app with `c-invoice-pay-flow`, and the Checkout_Flow.

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

The portal uses `styles.css`. The checkout inside the frame is styled in Salesforce by the `checkoutStyles` static
resource that the Lightning Out site loads.
