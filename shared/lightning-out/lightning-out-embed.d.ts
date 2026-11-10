export interface LightningOutConfig {
    /** Experience Cloud domain that serves the Lightning Out site, e.g. https://MY-DOMAIN.my.site.com */
    orgUrl: string;
    /** Lightning Out runtime script on the org's My Domain. */
    runtimeUrl: string;
    /** URL prefix of the Lightning Out site, e.g. "lightningout". */
    sitePrefix: string;
    /** Id of the Lightning Out app (Setup > Lightning Out 2.0 Apps). */
    appId: string;
}

export interface EmbedOptions {
    container: HTMLElement;
    config: LightningOutConfig;
    component: string;
    attributes?: Record<string, string>;
    loadedMinHeight?: number;
    onResize?: (height: number) => void;
    onLoaded?: () => void;
    onRedirect?: (url: string) => void;
}

export function loadLightningOutRuntime(runtimeUrl: string): Promise<void>;
export function embedLightningOut(options: EmbedOptions): { destroy: () => void };
export function warmUpLightningOut(options: { config: LightningOutConfig; component: string; attributes?: Record<string, string> }): void;
