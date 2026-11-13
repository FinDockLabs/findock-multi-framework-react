/**
 * Example bar: a slim strip at the top of every hosted example that says the page is an example with a fictional
 * brand, and switches between the examples.
 *
 * Demo-only. On your own site, remove the <script src="shared/example-bar.js"> line from the HTML.
 * The list below points at FinDock's hosted copies of the examples; change it if you host them yourself.
 */
const EXAMPLES = [
    { id: 'donation', label: 'Donation page', url: 'https://canopy-gibbon-trust.netlify.app/' },
    { id: 'checkout', label: 'Checkout', url: 'https://findock-gibbons.netlify.app/checkout-page/' },
    {
        id: 'pay-link',
        label: 'Pay Link',
        url: 'https://findock-gibbons.netlify.app/pay-link/?id=553f907b-f122-f6bb-3973-cad113117f80',
    },
    { id: 'portal', label: 'Customer portal', url: 'https://findock-gibbons.netlify.app/' },
];

const CSS = `
.fd-example-bar{position:relative;z-index:1000;display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;
  padding:7px 16px;background:#111318;color:#E7E9EE;font:500 13px/1.4 "IBM Plex Sans",Inter,"Helvetica Neue",Arial,sans-serif}
.fd-example-bar *{box-sizing:border-box}
.fd-example-bar__label{display:inline-flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap}
.fd-example-bar__label::before{content:"Example";padding:2px 8px;border-radius:999px;background:#F2C94C;color:#111318;
  font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.fd-example-bar__note{color:#A3A9B6}
.fd-example-bar nav{display:flex;flex-wrap:wrap;gap:4px;margin-left:auto}
.fd-example-bar a{padding:3px 10px;border-radius:999px;color:#E7E9EE;text-decoration:none;white-space:nowrap}
.fd-example-bar a:hover{background:rgba(255,255,255,.12)}
.fd-example-bar a[aria-current="page"]{background:#FFFFFF;color:#111318}
@media (max-width:767px){.fd-example-bar__note{display:none}.fd-example-bar nav{margin-left:0;width:100%;overflow-x:auto;flex-wrap:nowrap}}
`;

function currentExample() {
    const { hostname, pathname } = window.location;
    if (hostname.startsWith('canopy-gibbon-trust')) return 'donation';
    if (pathname.includes('/checkout-page/')) return 'checkout';
    if (pathname.includes('/pay-link/')) return 'pay-link';
    if (hostname.startsWith('findock-gibbons')) return 'portal';
    return document.currentScript?.dataset.example || '';
}

function render() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const current = currentExample();
    const bar = document.createElement('div');
    bar.className = 'fd-example-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Example site');

    const label = document.createElement('span');
    label.className = 'fd-example-bar__label';
    label.textContent = 'FinDock website examples';
    const note = document.createElement('span');
    note.className = 'fd-example-bar__note';
    note.textContent = 'Fictional brands on a test org. No real money is taken.';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Examples');
    for (const example of EXAMPLES) {
        const link = document.createElement('a');
        link.href = example.url;
        link.textContent = example.label;
        if (example.id === current) {
            link.setAttribute('aria-current', 'page');
        }
        nav.appendChild(link);
    }

    bar.append(label, note, nav);
    document.body.prepend(bar);
}

if (document.body) {
    render();
} else {
    document.addEventListener('DOMContentLoaded', render, { once: true });
}
