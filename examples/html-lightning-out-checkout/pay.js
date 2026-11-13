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

document.title = `Pay invoice ${ref} · Your company customer portal`;
document.getElementById('crumb-ref').textContent = ref;
document.getElementById('pay-title').textContent = `Pay invoice ${ref}`;

const loading = document.getElementById('pay-loading');
const loadingMessage = document.getElementById('loading-message');

// The invoice card is the Pay_Link_Flow in Salesforce, run by the c-pay-link-flow wrapper component for the
// installment (invoice) in the URL: amount, due date, a short summary, the PDF and the payment methods.
// Hosted payments return to these pages.
const here = new URL('.', window.location.href);
embedLightningOut({
    container: document.querySelector('.pay-embed'),
    config: LIGHTNING_OUT,
    component: 'c-pay-link-flow',
    attributes: {
        'record-guid': guid,
        'link-type': 'invoice',
        'merchant-name': 'Your company',
        'invoice-url': new URL(`invoices/invoice-${ref}.pdf`, here).href,
        'success-url': new URL(`thank-you.html?ref=${encodeURIComponent(ref)}`, here).href,
        'failure-url': new URL(`pay.html?invoice=${encodeURIComponent(guid)}&ref=${encodeURIComponent(ref)}`, here).href,
    },
    // A paid invoice shows a short card, so count anything from 150px as loaded.
    loadedMinHeight: 150,
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
