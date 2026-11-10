import { embedLightningOut } from './shared/lightning-out-embed.js';
import { LIGHTNING_OUT } from './config.js';

const SLOW_AFTER_MS = 15000;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF_PATTERN = /^INST-\d{4,}$/;

const params = new URLSearchParams(window.location.search);
const guid = params.get('invoice');
const ref = params.get('ref');

if (!guid || !GUID_PATTERN.test(guid) || !ref || !REF_PATTERN.test(ref)) {
    window.location.replace('./');
    throw new Error('No valid invoice in the URL');
}

document.title = `Pay invoice ${ref} · FinDock Gibbons customer portal`;
document.getElementById('crumb-ref').textContent = ref;
document.getElementById('pay-title').textContent = `Pay invoice ${ref}`;
const pdfLink = document.getElementById('pdf-link');
pdfLink.href = `invoices/invoice-${ref}.pdf`;
pdfLink.hidden = false;

const checkoutEmbed = document.querySelector('.checkout-embed');
const loading = document.getElementById('checkout-loading');
const loadingMessage = document.getElementById('loading-message');

// The checkout is the Checkout_Flow in Salesforce, run by the c-invoice-pay-flow wrapper component
// for the installment (invoice) in the URL. Hosted payments return to these pages.
const here = new URL('.', window.location.href);
embedLightningOut({
    container: checkoutEmbed,
    config: LIGHTNING_OUT,
    component: 'c-invoice-pay-flow',
    attributes: {
        'installment-guid': guid,
        'success-url': new URL(`thank-you.html?ref=${encodeURIComponent(ref)}`, here).href,
        'failure-url': new URL(`pay.html?invoice=${encodeURIComponent(guid)}&ref=${encodeURIComponent(ref)}`, here).href,
    },
    onLoaded: hideLoading,
});

const slowTimer = setTimeout(() => {
    loadingMessage.textContent = 'Still connecting to Salesforce. This can take a moment the first time…';
}, SLOW_AFTER_MS);

function hideLoading() {
    clearTimeout(slowTimer);
    loading.classList.add('done');
    loading.addEventListener('transitionend', () => {
        loading.hidden = true;
    }, { once: true });
}
