import { LightningElement, api } from 'lwc';

// Lightning Out renders this component in an iframe that doesn't grow with its content,
// so tell the embedding page how tall the donation form is whenever it changes.
const RESIZE_MESSAGE = 'findock-resize';

export default class DonationFlow extends LightningElement {
    // Set by the host page (success-url / failure-url) so hosted payments return to the embedding site.
    @api successUrl;
    @api failureUrl;

    resizeObserver;
    lastHeight = 0;

    get inputVariables() {
        const vars = [];
        if (this.successUrl) {
            vars.push({ name: 'successUrl', type: 'String', value: this.successUrl });
        }
        if (this.failureUrl) {
            vars.push({ name: 'failureUrl', type: 'String', value: this.failureUrl });
        }
        return vars;
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
