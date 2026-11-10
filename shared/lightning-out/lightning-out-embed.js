/**
 * Embed a Salesforce component (here: a FinDock payment or donation flow) on any website with Lightning Out 2.0.
 *
 * Plain JavaScript, no framework: the HTML examples import it directly, the React example wraps it in a component.
 *
 * What it does on top of the standard <lightning-out-application> tag:
 * - loads the Lightning Out runtime script once, however many embeds are on the page;
 * - sizes the container to the component's height (the Lightning Out iframe doesn't grow by itself);
 * - follows redirects to a hosted payment page (the FinDock pay button can't navigate the top window itself);
 * - tells you when the component has actually rendered, so you can hide a loading skeleton.
 *
 * The height and redirect messages are posted by the wrapper component in Salesforce (c-donation-flow,
 * c-invoice-pay-flow; see /salesforce). They are only accepted from the Experience Cloud site that hosts it.
 */

const loadedRuntimes = new Map();

/**
 * Load the Lightning Out runtime once per URL.
 * @param {string} runtimeUrl e.g. https://MY-DOMAIN.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js
 * @returns {Promise<void>}
 */
export function loadLightningOutRuntime(runtimeUrl) {
    if (!loadedRuntimes.has(runtimeUrl)) {
        loadedRuntimes.set(runtimeUrl, new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = runtimeUrl;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Could not load the Lightning Out runtime from ${runtimeUrl}`));
            document.head.appendChild(script);
        }));
    }
    return loadedRuntimes.get(runtimeUrl);
}

/**
 * @typedef {object} LightningOutConfig
 * @property {string} orgUrl      Experience Cloud domain that serves Lightning Out, e.g. https://MY-DOMAIN.my.site.com
 * @property {string} runtimeUrl  Lightning Out runtime script on the org's My Domain
 * @property {string} sitePrefix  URL prefix of the Lightning Out site, e.g. "lightningout"
 * @property {string} appId       Id of the Lightning Out app (Setup > Lightning Out 2.0 Apps)
 */

/**
 * @param {object} options
 * @param {HTMLElement} options.container        Element the component is rendered in; its height follows the component.
 * @param {LightningOutConfig} options.config
 * @param {string} options.component             Component tag, e.g. "c-donation-flow".
 * @param {Record<string, string>} [options.attributes] Attributes for the component (kebab-case), e.g. {"success-url": "..."}.
 * @param {number} [options.loadedMinHeight=400] Heights below this are the component's own loading state, not content.
 * @param {(height: number) => void} [options.onResize]
 * @param {() => void} [options.onLoaded]        Called once, on the first height at or above loadedMinHeight.
 * @param {(url: string) => void} [options.onRedirect] Defaults to navigating the page to the hosted payment page.
 * @returns {{ destroy: () => void }}
 */
export function embedLightningOut({
    container,
    config,
    component,
    attributes = {},
    loadedMinHeight = 400,
    onResize,
    onLoaded,
    onRedirect = (url) => { window.location.href = url; },
}) {
    // Set every attribute before the runtime starts the component: Lightning Out reads them once.
    // Keep the application element free of child nodes: the runtime rejects them.
    const app = document.createElement('lightning-out-application');
    app.setAttribute('org-url', config.orgUrl);
    app.setAttribute('site-prefix', config.sitePrefix);
    app.setAttribute('app-id', config.appId);
    app.setAttribute('components', component);

    const element = document.createElement(component);
    for (const [name, value] of Object.entries(attributes)) {
        if (value != null) {
            element.setAttribute(name, value);
        }
    }
    container.append(app, element);

    let loaded = false;
    function onMessage(event) {
        if (event.origin !== config.orgUrl) {
            return;
        }
        const data = event.data;
        if (data?.type === 'findock-redirect' && typeof data.url === 'string' && data.url.startsWith('https://')) {
            onRedirect(data.url);
        }
        if (data?.type === 'findock-resize' && Number.isFinite(data.height) && data.height > 0) {
            if (!loaded && data.height < loadedMinHeight) {
                return;
            }
            container.style.height = `${Math.ceil(data.height)}px`;
            onResize?.(data.height);
            if (!loaded) {
                loaded = true;
                onLoaded?.();
            }
        }
    }
    window.addEventListener('message', onMessage);
    loadLightningOutRuntime(config.runtimeUrl);

    return {
        destroy() {
            window.removeEventListener('message', onMessage);
            app.remove();
            element.remove();
        },
    };
}

/**
 * Salesforce starts a flow slowly when its cache is cold (after a deploy or a quiet period). Start one invisible
 * instance early, for example on a list page before the visitor clicks "Pay now", so the real one opens warm.
 * Removed again once it has rendered, or after a minute.
 * @param {{ config: LightningOutConfig, component: string, attributes?: Record<string, string> }} options
 */
export function warmUpLightningOut({ config, component, attributes = {} }) {
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.inert = true;
    // Kept inside the viewport but invisible: browsers pause off-screen cross-origin iframes.
    holder.style.cssText = 'position:fixed;right:0;bottom:0;width:1200px;height:900px;overflow:hidden;opacity:0;pointer-events:none;z-index:-2;';
    document.body.appendChild(holder);

    let embed;
    const done = () => {
        clearTimeout(timer);
        embed?.destroy();
        holder.remove();
    };
    const timer = setTimeout(done, 60000);
    embed = embedLightningOut({ container: holder, config, component, attributes, onLoaded: done, onRedirect: () => {} });
}
