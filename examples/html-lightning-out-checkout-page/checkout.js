import { embedLightningOut } from './shared/lightning-out-embed.js';
import { LIGHTNING_OUT } from './config.js';

const SLOW_AFTER_MS = 15000;
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ?invoice=<GUID> pays an existing installment or recurring payment, like a "Pay now" link in an invoice email.
// Without it, the Checkout_Flow takes a new payment.
const guid = new URLSearchParams(window.location.search).get('invoice');
const validGuid = guid && GUID_PATTERN.test(guid) ? guid : null;

const here = new URL('.', window.location.href);
const attributes = {
    'success-url': new URL('payment-received.html', here).href,
    // A failed or cancelled hosted payment comes back to this same checkout.
    'failure-url': window.location.href,
};
if (validGuid) {
    attributes['installment-guid'] = validGuid;
}

const loading = document.getElementById('checkout-loading');
const loadingMessage = document.getElementById('loading-message');

embedLightningOut({
    container: document.querySelector('.checkout-embed'),
    config: LIGHTNING_OUT,
    component: 'c-invoice-pay-flow',
    attributes,
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
