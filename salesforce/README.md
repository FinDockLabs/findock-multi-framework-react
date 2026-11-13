# Salesforce setup for the Lightning Out examples

What the org needs so websites can embed FinDock's flows with Lightning Out 2.0. Used by
`examples/html-lightning-out-donation`, `examples/html-lightning-out-checkout`,
`examples/html-lightning-out-checkout-page`, `examples/html-lightning-out-pay-link` and
`examples/react-multi-framework-lightning-out`.

| Path | What it is |
|---|---|
| `lwc/donationFlow` | `c-donation-flow`: runs `Donation_Flow` with `lightning-flow`, takes `success-url` / `failure-url`, posts its height to the host page |
| `lwc/invoicePayFlow` | `c-invoice-pay-flow`: runs `Checkout_Flow` for an installment (`installment-guid`), same messages |
| `lwc/payLinkFlow` | `c-pay-link-flow`: runs `Pay_Link_Flow` (`record-guid`, `link-type`, `invoice-url`, `merchant-name`), same messages; loads the `payLinkStyles` static resource itself |
| `lightningOutApps/Lightning_Out_App` | The Lightning Out 2.0 app: lists every component the flows render (wrappers, template components, FinDock components). A component missing here fails to load inside Lightning Out |
| `flows/Donation_Flow`, `flows/Checkout_Flow` | The flows, based on the FinDockLabs templates. Default return URLs point to `https://YOUR-DOMAIN.my.site.com/...`; the payment method config names the demo org's processors: adjust both in Flow Builder |
| `staticresources/canopyStyles`, `checkoutStyles`, `payLinkStyles` | Styles for the flows inside Lightning Out (the host page's CSS doesn't reach into the frame), plus logos and icons. `payLinkStyles` is a copy of the Pay Link site's stylesheet |
| `cspTrustedSites`, `corsWhitelistOrigins` | Examples for trusting a website (`https://www.example.org`): copy per website |

## Prerequisites

- FinDock installed, with ProcessingHub connected and payment methods active.
- The FinDockLabs [experience-cloud-templates](https://github.com/FinDockLabs/experience-cloud-templates): the
  NPSP donation flow package (template components `amountAndFrequency`, `currencyPicker`,
  `experienceProgressStages`), the checkout package (`paymentAmount`), and for the pay link example the Pay Link
  Flow package (`Pay_Link_Flow` and its `FinDockLabs_Pay_Link_Flow_Guest_Access` permission set).
- A **Lightning Out** Experience Cloud site (LWR) with URL prefix `lightningout`, guest access enabled, and its guest
  user assigned the FinDock Payer permission set group and each template's guest permission set. In its Head Markup,
  load the FinDock styles and the stylesheets from this folder:

  ```html
  <link rel="stylesheet" href="{ basePath }/sfsites/c/resource/findockAssets/dxp-styles.css?{ versionKey }" />
  <link rel="stylesheet" href="{ basePath }/sfsites/c/resource/checkoutStyles?{ versionKey }" />
  <link rel="stylesheet" href="{ basePath }/sfsites/c/resource/canopyStyles?{ versionKey }" />
  ```

## Deploy

```bash
cd salesforce
# The Lightning Out app needs API 68 or later (this project's sourceApiVersion).
sf project deploy start -o <alias> -d force-app
sf community publish -o <alias> --name "Lightning Out"
```

Then, for each website that embeds a flow, trust its address: see
[Trust your website in Salesforce](../examples/html-lightning-out-donation/README.md#trust-your-website-in-salesforce).
A React app hosted on the same Experience Cloud domain needs none of that.

## Sharing an org

If several people use the same org for Lightning Out demos, **merge** into the Lightning Out app's component list and
the site's trusted domains instead of replacing them, and give wrapper components specific names (`c-invoice-pay-flow`,
not `c-pay-flow`). Deploying this folder's `Lightning_Out_App` replaces the whole component list.
