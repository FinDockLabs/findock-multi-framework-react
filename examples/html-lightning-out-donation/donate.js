import { embedLightningOut } from './shared/lightning-out-embed.js';
import { LIGHTNING_OUT } from './config.js';

const SLOW_AFTER_MS = 15000;

const embed = document.getElementById('donate-embed');
const loading = document.getElementById('donate-loading');
const loadingMessage = document.getElementById('loading-message');

// The donation form is the Donation_Flow in Salesforce, run by the c-donation-flow wrapper component.
// The flow sends the donor back to these pages after a hosted payment (iDEAL, PayPal, ...).
const here = new URL('.', window.location.href);
embedLightningOut({
    container: embed,
    config: LIGHTNING_OUT,
    component: 'c-donation-flow',
    attributes: {
        'success-url': new URL('thank-you.html', here).href,
        'failure-url': new URL('payment-failed.html', here).href,
    },
    onLoaded: hideLoading,
});

const slowTimer = setTimeout(() => {
    loadingMessage.textContent = 'Still connecting to Salesforce. This can take a moment the first time…';
}, SLOW_AFTER_MS);

function hideLoading() {
    clearTimeout(slowTimer);
    embed.style.minHeight = '0';
    loading.classList.add('done');
    loading.addEventListener('transitionend', () => {
        loading.hidden = true;
    }, { once: true });
}
