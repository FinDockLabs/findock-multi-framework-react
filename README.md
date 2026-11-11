# FinDock website examples

Example donation and checkout websites that take payments through [FinDock](https://www.findock.com) on Salesforce,
for developers who build their own site instead of using an Experience Cloud template.

All examples share one fictional brand, **Canopy Gibbon Trust** (and the **FinDock Gibbons** customer portal), so
you can compare the techniques side by side. A pill in each site's header says which technique the page uses.

| Example | Built with | Form | Hosted on | Talks to FinDock through |
|---|---|---|---|---|
| [`examples/html-lightning-out-donation`](examples/html-lightning-out-donation) | Plain HTML, CSS, JavaScript | Salesforce Donation_Flow, embedded | Any static host (Netlify, Vercel, …) | Lightning Out 2.0 → flow → FinDock components |
| [`examples/html-lightning-out-checkout`](examples/html-lightning-out-checkout) | Plain HTML, CSS, JavaScript | Salesforce Checkout_Flow, embedded in a customer portal | Any static host | Lightning Out 2.0 → flow → FinDock components |
| [`examples/html-lightning-out-checkout-page`](examples/html-lightning-out-checkout-page) | Plain HTML, CSS, JavaScript | Salesforce Checkout_Flow on a page of its own (the checkout template, without a portal) | Any static host | Lightning Out 2.0 → flow → FinDock components |
| [`examples/react-multi-framework-api`](examples/react-multi-framework-api) | React (Salesforce Multi-Framework) | Its own React form | Experience Cloud site | Apex REST → FinDock Payment API |
| [`examples/react-multi-framework-lightning-out`](examples/react-multi-framework-lightning-out) | React (Salesforce Multi-Framework) | Salesforce Donation_Flow, embedded | Experience Cloud site | Lightning Out 2.0 → flow → FinDock components |

**Which one fits?**

- You want full control over the form's markup and behaviour: **React + FinDock API**.
- You want FinDock's ready-made flow (payment methods, mandates, Gift Aid, recurring) on a site you already have:
  **Lightning Out**. The plain-HTML versions show the integration with nothing else in the way; the React version
  shows the same in a React app.

These are reference examples, not templates to deploy as-is: replace the brand, copy and settings with your own.

## Repository layout

```
examples/        one folder per example, each with its own README and deploy steps
shared/
  canopy/        brand tokens, page layout CSS, logo, photo and icons
  lightning-out/ lightning-out-embed.js: loads Lightning Out, sizes the frame, follows payment redirects
  react/         React versions of the page sections and a <LightningOutEmbed> component
salesforce/      Salesforce metadata both Lightning Out examples need (wrapper components, app, flows, styles)
scripts/         sync-shared.mjs: copies /shared into the plain-HTML examples
```

What is shared between the examples, and what isn't:

| Part | Shared? |
|---|---|
| Brand (colours, fonts, logo) | Yes: `shared/canopy/tokens.css`, used by every example |
| Page sections (header, hero, cards, FAQ, footer, result pages) | Yes: `shared/canopy/site.css`, plus `shared/react/canopy.tsx` for the React examples (same markup and classes) |
| Lightning Out embed logic | Yes: `shared/lightning-out/lightning-out-embed.js`, used directly by the HTML examples and wrapped by `shared/react/LightningOutEmbed.tsx` |
| The donation form | No, on purpose: the API example builds its own React form; the Lightning Out examples show the Salesforce flow, styled from Salesforce |

### Shared files in the plain-HTML examples

The HTML examples must be servable on their own by any static host, so they contain a copy of the shared files
(in their `shared/` folder). Edit the originals under `/shared`, then:

```bash
npm run sync-shared    # copy /shared into the HTML examples
npm run check-shared   # fails if a copy is out of date (use in CI)
```

The React examples import `/shared` directly at build time (Vite alias `@shared`).

## Deploying

Each example's README has the full steps. In short:

| Example | Where it runs | How |
|---|---|---|
| HTML donation, HTML checkout, HTML checkout page | Any static host | Publish the example folder as-is (no build step): [Netlify, Vercel, Cloudflare Pages, GitHub Pages](examples/html-lightning-out-donation/README.md#deploy), or your own web server. Then trust the site's domain in Salesforce |
| React + FinDock API | Salesforce (Experience Cloud) | `npm run build` in the app folder, then `sf project deploy start` ([steps](examples/react-multi-framework-api/README.md#deploy)) |
| React + Lightning Out | Salesforce (Experience Cloud) | Same as above ([steps](examples/react-multi-framework-lightning-out/README.md#deploy)) |
| Lightning Out setup | Salesforce | Once per org, for all Lightning Out examples ([salesforce/README.md](salesforce/README.md)) |

## Styling

FinDock's components take their styling from Experience Cloud `--dxp-*` styling hooks. See
[Payment Experiences styling](https://docs.findock.com/docs/november-26/payments/payment-experiences-styling) for how
to set them on an Experience Cloud site, on a Lightning Out container and from an external website.
