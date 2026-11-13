# Checkout page: plain HTML + Lightning Out

A single checkout page in plain HTML, CSS and JavaScript, with FinDock's Salesforce **Checkout_Flow** embedded through
**Lightning Out 2.0**. It is the Experience Cloud checkout template's page on your own website: a header, the
checkout and a footer, nothing else.

Use it for a "Pay now" link in an invoice email, a payment reminder or a QR code on a paper invoice. For a checkout
inside a customer portal with an invoice list, see [html-lightning-out-checkout](../html-lightning-out-checkout).

Fictional company: **Your company**, the neutral brand of the Experience Cloud checkout and Pay Link templates.

| File | What it is |
|---|---|
| `index.html`, `checkout.js` | The checkout page. Embeds `c-invoice-pay-flow`, shows a loading skeleton until it's ready |
| `payment-received.html` | Return page after a successful payment |
| `config.js` | Your org's Lightning Out settings |
| `styles.css` | The page's look (header, footer, skeleton) |
| `shared/example-bar.js` | The demo's "Example" bar. Remove its `<script>` line from the HTML on your own site |
| `shared/lightning-out-embed.js` | Copy of `/shared/lightning-out/lightning-out-embed.js` (run `npm run sync-shared` in the repo root after editing the original) |

## What it pays

| URL | Checkout |
|---|---|
| `index.html?invoice=<GUID>` | Pays an existing installment or recurring payment: the GUID is the record's `cpm__GUID__c` |
| `index.html` | Takes a new payment, with the amount and details the Checkout_Flow sets by default |

After a hosted payment (iDEAL, PayPal, …), the payer returns to `payment-received.html`, or to the checkout again if
the payment failed or was cancelled.

## Prerequisites

The Salesforce side, once per org: see [salesforce/README.md](../../salesforce/README.md). You need a Lightning Out
site, the Lightning Out app with `c-invoice-pay-flow`, and the Checkout_Flow.

## Configure

Edit `config.js`:

| Setting | Where to find it |
|---|---|
| `orgUrl` | Your Experience Cloud domain, e.g. `https://acme.my.site.com` |
| `runtimeUrl` | `https://<your My Domain>.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js` |
| `sitePrefix` | URL prefix of your Lightning Out site, e.g. `lightningout` |
| `appId` | Setup › Lightning Out 2.0 Apps › your app, the Id starting with `1Us` |

## Run locally

```bash
npm run serve:html-checkout-page
```

## Deploy

A finished static site: publish the folder as-is, with no build step.

| Host | How |
|---|---|
| Netlify | `npx netlify-cli deploy --dir examples/html-lightning-out-checkout-page --prod`, or Git import with base directory `examples/html-lightning-out-checkout-page`, no build command |
| Vercel | `cd examples/html-lightning-out-checkout-page && npx vercel --prod` (framework "Other", no build command), or Git import with Root Directory `examples/html-lightning-out-checkout-page` |
| Cloudflare Pages | `npx wrangler pages deploy examples/html-lightning-out-checkout-page --project-name findock-checkout` |
| GitHub Pages | Actions workflow uploading `examples/html-lightning-out-checkout-page` (relative links work under `/<repository>/`) |
| Your own server | Copy the folder to the web root; serve `.js` as `text/javascript` |

Then trust the site's address in Salesforce, exactly as for the donation example:
[Trust your website in Salesforce](../html-lightning-out-donation/README.md#trust-your-website-in-salesforce).

## Styling

- The page: `styles.css`. Brand colours are the variables at the top: `--ink` for text, `--navy` for buttons and the
  logo, `--border` for lines.
- The checkout inside the frame: styled in Salesforce by the `checkoutStyles` static resource that the Lightning Out
  site loads. Lightning Out doesn't pass your page's CSS into the frame. See
  [Payment Experiences styling](https://docs.findock.com/docs/november-26/payments/payment-experiences-styling).
