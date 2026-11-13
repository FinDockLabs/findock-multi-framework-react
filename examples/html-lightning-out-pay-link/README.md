# Pay Link: plain HTML + Lightning Out

The page behind a "Pay now" link in an invoice or payment request email, in plain HTML, CSS and JavaScript. FinDock's
Salesforce **Pay_Link_Flow** is embedded through **Lightning Out 2.0**. It is the Experience Cloud Pay Link template
on your own website: the merchant name above one card with the amount, a short summary and the payment methods.

Fictional company: **Your company**, the neutral brand of the Experience Cloud checkout and Pay Link templates.

| File | What it is |
|---|---|
| `index.html`, `pay-link.js` | The pay link page. Embeds `c-pay-link-flow`, shows a skeleton card until it's ready |
| `payment-received.html` | Return page after a successful hosted payment |
| `config.js` | Your org's Lightning Out settings |
| `styles.css` | The page's look (grey page, merchant name, skeleton, footer) |
| `shared/lightning-out-embed.js` | Copy of `/shared/lightning-out/lightning-out-embed.js` (run `npm run sync-shared` in the repo root after editing the original) |
| `shared/example-bar.js` | The demo's "Example" bar. Remove its `<script>` line from the HTML on your own site |

## What it shows

| URL | Card |
|---|---|
| `index.html?id=<GUID>` | An invoice: amount, due date, To / From / Invoice / Memo, payment methods. The GUID is the installment's `cpm__GUID__c` |
| `index.html?id=<GUID>&type=link` | The same record as a payment link: From and For only |
| `index.html?id=<GUID>&invoice=<https URL of a PDF>` | Adds an invoice thumbnail that opens the PDF |
| `index.html?id=<GUID of a recurring payment>` | Change the payment method of a recurring payment |

A paid installment shows "Invoice paid", an unknown id shows "This link is not valid". All of that comes from the
flow, so the page itself has no logic beyond reading the URL.

## Prerequisites

The Salesforce side, once per org: see [salesforce/README.md](../../salesforce/README.md). You need the Pay Link
Flow (FinDockLabs Pay Link template), the `payLinkStyles` static resource, `c-pay-link-flow` in the Lightning Out
app, and the Lightning Out site's guest user with the Pay Link Flow guest permission set.

## Configure

Edit `config.js` exactly as for the [checkout page](../html-lightning-out-checkout-page/README.md#configure).
The merchant name in the card's From row is set in `pay-link.js` (`merchant-name`); without it the flow uses the
Salesforce organization name.

## Deploy

A finished static site: publish the folder as-is, with no build step, on any host listed for the
[checkout page](../html-lightning-out-checkout-page/README.md#deploy). Then trust the site's address in Salesforce:
[Trust your website in Salesforce](../html-lightning-out-donation/README.md#trust-your-website-in-salesforce).

## Styling

- The page: `styles.css`. The colours are the variables at the top.
- The card inside the frame: styled in Salesforce by the `payLinkStyles` static resource, the same file the Pay Link
  Experience Cloud site uses. `c-pay-link-flow` loads it itself, so the Lightning Out site's Head Markup doesn't need
  to change. The frame is transparent, so your page colour shows around the card.
