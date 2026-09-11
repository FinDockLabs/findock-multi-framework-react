# AGENTS.md — how to (re)build this donation site

Instructions for coding agents working in this repository or asked to build the same site again.
Generic Salesforce Multi-Framework mechanics are **not** documented here: load the `building-ui-bundle-*`
skills (sf-skills) for scaffolding, data access, deployment and Experience-site metadata, and the FinDock
`payment-web-builder` skill (FinDock Labs) for the FinDock contract, UX rules and accessibility rules.
This file only records what is specific to this site and what those skills got wrong or left out.

## What this site is

A public (guest) donation page, one-time **and** monthly, as a React UI bundle (`DonatePortal`) on an
Experience site (`Donate`, url prefix `/donate`), taking payments through the FinDock Payment API called
**on-platform** from an Apex REST wrapper. Fictional charity: **Tidewell Foundation** (clean water).
Architecture, file map and design decisions: see `README.md`. Read it before changing anything.

## Non-negotiable decisions (do not "simplify" these away)

1. **The browser never calls FinDock and is never trusted.** All policy lives in `DonationPaymentService`:
   amount bounds, frequency, offered methods, declared parameters only, payer shape, return-URL origin.
2. **Nothing org-specific in code.** Everything variable lives in `Donation_Page_Setting__mdt.Default`
   (currency, processor, payer record type, offered methods, presets, bounds, campaign, origin, support email).
   If you need a new org-specific value, add a field to the CMT, not a constant.
3. **Payment methods are dynamic.** `getConfig()` reads FinDock's live `/PaymentMethods`, filters by the CMT
   allow-list (in configured order), resolves processor = configured override → `IsDefault` → first, and
   passes logo, `SupportsRecurring`, `InitialPaymentOnRecurring` and parameter definitions to the page.
   Never hardcode method or issuer lists in the frontend.
4. **Donor-visible parameters** = `required` or enum (has `options`). Optional free-text parameters
   (`locale`, `itemName`, `description`) are hidden; Apex fills `itemName`/`description` with
   "Gift to <org>" / "Monthly gift to <org>".
5. **Return URLs** are built client-side with `appUrl('/thank-you')` / `appUrl('/failed')` (preserves the site
   prefix) and validated server-side against the request `Host`, the org domain, `*.my.site.com`,
   `*.force.com`, `*.salesforce.com` and `Allowed_Return_Hosts__c`.
6. **Recurring** sends `Recurring {Amount, Frequency:'Monthly', StartDate, CurrencyISOCode}`. If the chosen
   processor reports `InitialPaymentOnRecurring == 'required'`, also send `OneTime {Amount}` and start the
   schedule at `today + 1 month`.
7. **Error routing**: FinDock codes 201–205 → `recoverable` (field-level, donor stays on the form); anything
   else → `failed` with one generic message and the raw body only in `System.debug`. Never leak FinDock text.
8. **Field order and selector layout** per the FinDock skill: details before payment method; radio → logo →
   label; logos only from `Processors[].image.svg` (CSP trusted sites for `external.findock.com` and
   `images.findock.com` are already in the repo).
9. **Accessibility is not optional**: visually hidden but focusable radios (`.choice-input`), `aria-invalid`
   + `aria-describedby` on every error, `role=status` step announcements, reduced-motion, 44px targets,
   16px inputs, one column at 390px. Contrast tokens in `global.css` are already AA; keep them.

## FinDock facts verified against the org (override anything a skill says otherwise)

- Entry points are **no-argument** static methods that read/write `RestContext`:
  `cpm.API_PaymentIntent_V2.postPaymentIntent()` and `cpm.API_PaymentMethod_V2.getPaymentMethods()`.
  `postPaymentIntent(String)` does **not** compile. Swap `RestContext.request/response`, call, read
  `RestContext.response`, restore the originals in `finally` (`FinDockRestContextGateway`).
- Guest user permissions, per the FinDock docs: the **FinDock Payer** permission set group
  (`cpm__FinDock_Payer`, maintained by FinDock: Core Experience Cloud Run + FinDock Experience Cloud + processor
  sets) plus `Donation_Public_Access` (repo) for the REST entry point. Never assign individual FinDock sets
  directly. `sf org assign permsetgroup` does not exist in this CLI; insert a `PermissionSetAssignment` with
  `PermissionSetGroupId` via `sf data create record`.
- **The ProcessingHub hand-off is not completing in this org.** Every guest PaymentIntent leaves a
  `cpm__Message__c` with handler `cpm.GuidedMatchingJob.UserSwitcher` in `Scheduled` (start time set, no end
  time) and nothing downstream (Inbound Report, Installment, Gift Transaction) is created. The hub was
  connected before (June messages finished under the integration user), so the connection has probably lapsed;
  the connection setting is a protected custom setting and not visible via SOQL. Re-connect in FinDock Setup →
  Connect → ProcessingHub. This is org setup, not something to fix in this repo. Check message status after
  any live test; a redirect alone does not prove processing.
- This org has **no default processor** per method, so the resolved processor is always sent explicitly.
- FinDock for Fundraising (NPC) payers are Person Accounts: `Payer.Account.RecordTypeName = PersonAccount`,
  email as `PersonEmail`. Recurring maps to Gift Commitment + Schedule; `Frequency` values Daily/Weekly/Monthly/Yearly.
- Redirect for Stripe goes to `https://redirect.dev.findock.com/...` in this (test) org.

## Org facts for `npcPartnerOrg` (lab org used to build this)

| Fact | Value |
|---|---|
| Alias / domain | `npcPartnerOrg` / `npc-laurens-20231030-dev-ed.develop.my.salesforce.com` |
| Site URL | `https://npc-laurens-20231030-dev-ed.develop.my.site.com/donate/` |
| Guest user | `donate@00d2o000000iofueaq.org.force.com` |
| Corporate currency | EUR (multi-currency on) |
| Person Account record type | `PersonAccount` |
| Active methods used | `Ideal`, `CreditCard`, `SEPA Direct Debit` via `PaymentHub-Stripe` |
| Active campaigns for `?campaign=` tests | "Save Planet", "Preserve Wildlife", "Save Children" |

Discover these for another org with `sf data query` on `cpm__Payment_Method__c` (`cpm__IsActive__c`,
`cpm__Payment_Method__c`, `cpm__Support_Recurring__c`), `RecordType WHERE IsPersonType = true`,
`CurrencyType`, `Site`/`Network`, `Domain`, then edit the CMT record accordingly.

## Rebuild order (each step must pass before the next)

1. `sf template generate project`, then `sf template generate ui-bundle -n DonatePortal -t reactbasic
   -d force-app/main/default/uiBundles`; `npm install` in the bundle; add
   `@fontsource-variable/fraunces` and `@fontsource-variable/instrument-sans` (self-hosted fonts, no font CSP).
2. Backend: CMT type + `Default` record, `FinDockGateway*`, `DonationSettings`, `DonationPaymentService`,
   `DonationPaymentResource`, tests, permission set, CSP trusted sites. Deploy **all together** with
   `-l RunSpecifiedTests -t DonationPaymentServiceTest -t DonationPaymentResourceTest -t FinDockRestContextGatewayTest`.
   Developer/production-type orgs roll back the entire deploy on any test failure or missing coverage, so
   partial redeploys of only `classes/` will fail with "Invalid type" until the CMT is in.
3. Frontend: replace all template content (`index.html`, `appLayout.tsx`, `routes.tsx`, pages, `global.css`),
   delete `Home.tsx`, `navigationMenu.tsx`, `graphqlClient.ts`, `status-alert.tsx`, template assets.
   Routes: `/`, `/thank-you`, `/failed`, `*`. `ui-bundle.json` keeps `fallback: index.html`.
   Gate: `./node_modules/.bin/eslint src e2e` 0 problems, `vitest run` green, `npm run build` green.
4. Set `<target>Experience</target>` in `DonatePortal.uibundle-meta.xml`; deploy `uiBundles/` (dist must exist).
5. Site metadata (`networks/Donate`, `sites/Donate`, `digitalExperienceConfigs/Donate1`,
   `digitalExperiences/site/Donate1`) with `appSpace: "c__DonatePortal"`; deploy after the bundle.
6. Find the guest user (`Site.GuestUserId` for MasterLabel `Donate`); assign `Donation_Public_Access` and the
   `FinDock_Payer` group (via `PermissionSetAssignment.PermissionSetGroupId`).
7. Verify (see below). Only then report done.

## Verification that counts as "done"

- `curl <site>/sf/api/services/apexrest/donate/v1/config` as anonymous → 200 with the three methods.
- A policy-violating POST to `/intent` (amount below min, off-site return URL) → 400 `status: invalid`.
- `BASE_URL=<site>/ npm run e2e:smoke` (in the bundle dir) → `after submit: navigated` to a
  `redirect.*.findock.com/.../PaymentHub-Stripe/checkout` URL, both API calls 200. This creates a real €1
  test PaymentIntent for "Test Donor" in the org; say so in the report.
- `npm run e2e:screenshots` against `npm run dev` (mock data) → desktop + 390px shots, inspect them.

## Pitfalls hit while building this (don't repeat)

- Apex reserved identifiers: `hint`, `inner` cannot be variable/field names. Inner classes cannot have static
  methods. Typed `JSON.deserialize` cannot populate `Map<String, Object>` fields; use `Map<String, String>`.
- A test class must be `public` (not `private`) for another test class to reference its members; the
  gateway stub lives in its own `@IsTest public class FinDockGatewayStub`.
- Permission set `<description>` max 255 chars. Escape `<Id>` as `&lt;Id&gt;` inside field-description XML.
- With `RunSpecifiedTests`, every deployed class needs coverage; the RestContext gateway is covered by a test
  that calls the real managed methods with an empty body (no PSP contact) and asserts context restoration.
- `npm run dev` injects `SFDC_ENV` and proxies `/services/apexrest/*` to the default org; that proxy returned
  401 here, so the data layer mocks by default in dev (`VITE_DONATION_API=org` opts in to the proxy).
  `--port` is ignored by the dev script; it always listens on 5173.
- Vitest needs the `@` alias in `vitest.config.ts` (the template only defines it for Vite).
- Playwright cannot `.check()` the visually hidden radios; click the `label.choice` instead.
- macOS `sed` has no `\b`; use `perl -pi -e`.
- The Bash tool's `cd` can be reset between commands; run npm/eslint inside `(cd <bundle> && …)`.
