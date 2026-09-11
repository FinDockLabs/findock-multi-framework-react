/** Format an amount in the configured currency, dropping cents for whole amounts (€25, €12.50). */
export function formatMoney(amount: number, currencyCode: string, locale = 'en-IE'): string {
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(whole ? 0 : 2)}`;
  }
}

/** Currency symbol only (€, £, $), used as the input prefix. */
export function currencySymbol(currencyCode: string, locale = 'en-IE'): string {
  try {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).formatToParts(0);
    return parts.find(p => p.type === 'currency')?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

/** Parse a donor-typed amount ("12,50", "€ 25") into a number with at most two decimals, or null. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}
