import { warmUpLightningOut } from './shared/lightning-out-embed.js';
import { LIGHTNING_OUT } from './config.js';

const PAID_PREFIX = 'fdg-paid-';

const euro = (value) => `€${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function storage(action, key, value) {
    try {
        if (action === 'get') return localStorage.getItem(key);
        if (action === 'set') return localStorage.setItem(key, value);
        if (action === 'keys') return Object.keys(localStorage);
        if (action === 'remove') return localStorage.removeItem(key);
    } catch {
        // Storage unavailable (private mode): the demo just shows everything as open.
    }
    return action === 'keys' ? [] : null;
}

// The thank-you page records a payment in this browser, so the portal shows that invoice as paid.
function markPaidRows() {
    let anyPaid = false;
    document.querySelectorAll('tr[data-ref]').forEach((row) => {
        const paidOn = storage('get', PAID_PREFIX + row.dataset.ref);
        if (!paidOn) {
            return;
        }
        anyPaid = true;
        row.dataset.status = 'paid';
        const badge = document.createElement('span');
        badge.className = 'badge paid';
        badge.textContent = `Paid ${paidOn}`;
        row.querySelector('.status').replaceChildren(badge);
        const note = document.createElement('span');
        note.className = 'muted';
        note.textContent = 'Paid online';
        row.querySelector('.actions').replaceChildren(note);
    });
    document.getElementById('reset-demo').hidden = !anyPaid;
}

function updateSummary() {
    const rows = [...document.querySelectorAll('tbody tr')];
    const open = rows.filter((r) => r.dataset.status === 'open');
    const paid = rows.filter((r) => r.dataset.status === 'paid');
    const sum = (list) => list.reduce((total, r) => total + Number(r.dataset.amount), 0);

    document.getElementById('stat-open').textContent = euro(sum(open));
    document.getElementById('stat-open-sub').textContent = open.length
        ? `${open.length} invoice${open.length === 1 ? '' : 's'} to pay`
        : 'Nothing to pay';
    document.getElementById('stat-paid').textContent = euro(sum(paid));
    document.getElementById('stat-paid-sub').textContent = `${paid.length} invoice${paid.length === 1 ? '' : 's'}`;

    const next = open[0];
    const notice = document.getElementById('notice');
    if (!next) {
        notice.hidden = true;
        document.getElementById('stat-due').textContent = '—';
        document.getElementById('stat-due-sub').textContent = 'No open invoices';
        return;
    }
    document.getElementById('stat-due').textContent = next.dataset.due;
    document.getElementById('stat-due-sub').textContent = next.dataset.ref;
    document.getElementById('notice-title').textContent = `Invoice ${next.dataset.ref} is due on ${next.dataset.due}`;
    document.getElementById('notice-sub').textContent = `${next.dataset.desc} · ${euro(Number(next.dataset.amount))}`;
    document.getElementById('notice-pay').href = next.querySelector('a.button').href;
}

document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        document.querySelectorAll('tbody tr').forEach((row) => {
            row.hidden = filter !== 'all' && row.dataset.status !== filter;
        });
    });
});

document.getElementById('reset-demo').addEventListener('click', () => {
    storage('keys').filter((k) => k.startsWith(PAID_PREFIX)).forEach((k) => storage('remove', k));
    window.location.reload();
});

// Salesforce starts the checkout flow slowly when its cache is cold (after a deploy or a quiet period).
// Start one invisible checkout for the next open invoice, so "Pay now" opens a warm one.
function warmUpCheckout() {
    const next = document.querySelector('tr[data-status="open"] a.button');
    if (!next) {
        return;
    }
    const guid = new URL(next.href).searchParams.get('invoice');
    warmUpLightningOut({ config: LIGHTNING_OUT, component: 'c-invoice-pay-flow', attributes: { 'installment-guid': guid } });
}

markPaidRows();
updateSummary();
window.addEventListener('load', () => setTimeout(warmUpCheckout, 1000));
