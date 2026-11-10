/// <reference types="vite/client" />

/** Salesforce API version injected at build time by the Vite define plugin. */
declare const __SF_API_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_SALESFORCE_MY_DOMAIN?: string;
  readonly VITE_LIGHTNING_OUT_APP_ID?: string;
  readonly VITE_LIGHTNING_OUT_SITE_PREFIX?: string;
}
