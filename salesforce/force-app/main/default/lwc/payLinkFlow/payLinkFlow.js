import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import PAY_LINK_STYLES from '@salesforce/resourceUrl/payLinkStyles';

// Lightning Out renders this component in an iframe that doesn't grow with its content,
// so tell the embedding page how tall the pay link is whenever it changes.
const RESIZE_MESSAGE = 'findock-resize';

export default class PayLinkFlow extends LightningElement {
    // GUID of the installment or recurring payment to pay (record-guid).
    @api recordGuid;
    // "invoice" (default) or "link": an invoice shows To / Invoice rows, a payment link only From / For.
    @api linkType;
    // Optional link to the invoice PDF, shown as a thumbnail in the card.
    @api invoiceUrl;
    // Name shown in the From row; defaults to the Salesforce organization name.
    @api merchantName;
    // Set by the host page (success-url / failure-url) so hosted payments return to the embedding site.
    @api successUrl;
    @api failureUrl;

    resizeObserver;
    lastHeight = 0;
    stylesLoaded = false;

    get inputVariables() {
        const values = {
            id: this.recordGuid,
            type: this.linkType,
            invoiceUrl: this.invoiceUrl,
            merchantName: this.merchantName,
            successUrl: this.successUrl,
            failureUrl: this.failureUrl,
        };
        return Object.entries(values)
            .filter(([, value]) => value)
            .map(([name, value]) => ({ name, type: 'String', value }));
    }

    connectedCallback() {
        // The pay link look (rows, badges, PDF thumbnail) lives in the payLinkStyles static resource, the same
        // file the Pay Link site uses. Loading it here keeps the Lightning Out site's own styles untouched.
        if (!this.stylesLoaded) {
            this.stylesLoaded = true;
            loadStyle(this, PAY_LINK_STYLES).catch(() => {
                // Without the styles the pay link still works, it just looks plainer.
            });
        }
    }

    renderedCallback() {
        if (this.resizeObserver || window.parent === window) {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => this.postHeight());
        this.resizeObserver.observe(this.refs.root);
        this.postHeight();
    }

    disconnectedCallback() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    postHeight() {
        const height = Math.ceil(this.refs.root.getBoundingClientRect().height);
        if (height && height !== this.lastHeight) {
            this.lastHeight = height;
            // Only a height is shared, so any embedding origin may receive it.
            window.parent.postMessage({ type: RESIZE_MESSAGE, height }, '*');
        }
    }
}
