import { embedLightningOut } from './shared/lightning-out-embed.js';
import { LIGHTNING_OUT } from './config.js';

const SLOW_AFTER_MS = 15000;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The link in an invoice or payment request email:
//   ?id=<GUID>               an installment (invoice) or a recurring payment (change the payment method)
//   &type=link               show it as a payment link (From / For) instead of an invoice (To / Invoice)
//   &invoice=<URL of a PDF>  show the invoice as a thumbnail that opens the PDF
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const type = params.get('type') === 'link' ? 'link' : 'invoice';
const invoiceUrl = params.get('invoice');

const here = new URL('.', window.location.href);
const attributes = {
    // Without a valid id the flow shows its own "This link is not valid" message.
    'record-guid': id && GUID_PATTERN.test(id) ? id : 'missing',
    'link-type': type,
    'merchant-name': 'Your company',
    'success-url': new URL('payment-received.html', here).href,
    // A failed or cancelled hosted payment comes back to this same page.
    'failure-url': window.location.href,
};
if (invoiceUrl && /^https:\/\//.test(invoiceUrl)) {
    attributes['invoice-url'] = invoiceUrl;
}

const loading = document.getElementById('pay-loading');
const loadingMessage = document.getElementById('loading-message');

embedLightningOut({
    container: document.querySelector('.pay-embed'),
    config: LIGHTNING_OUT,
    component: 'c-pay-link-flow',
    attributes,
    // The "paid" and "not valid" cards are short, so count anything from 150px as loaded.
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
