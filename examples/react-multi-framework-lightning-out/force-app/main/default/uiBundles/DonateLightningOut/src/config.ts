import type { LightningOutConfig } from '@shared/lightning-out/lightning-out-embed.js';
import { getBasename } from './appUrl';

/**
 * Lightning Out settings. This app is served by an Experience Cloud site in the same org as the Lightning Out
 * site, so the flow is framed from the page's own origin: no extra CSP, CORS or framing settings are needed.
 *
 * The runtime script is served by this app itself (downloaded at build time, see scripts/fetch-lightning-out.mjs):
 * a Multi-Framework site only allows scripts from its own domain.
 */
const origin = window.location.origin;
const base = getBasename() ?? '';

export const LIGHTNING_OUT: LightningOutConfig = {
  orgUrl: origin,
  runtimeUrl: `${origin}${base === '/' ? '' : base}/lightning-out/index.iife.prod.js`,
  sitePrefix: import.meta.env.VITE_LIGHTNING_OUT_SITE_PREFIX || 'lightningout',
  appId: import.meta.env.VITE_LIGHTNING_OUT_APP_ID ?? '',
};
