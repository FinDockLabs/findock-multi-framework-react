import { describe, expect, it } from 'vitest';
import { currencySymbol, formatMoney, parseAmount } from '../money';

describe('money', () => {
  it('formats whole amounts without cents and fractional with two', () => {
    expect(formatMoney(25, 'EUR')).toBe('€25');
    expect(formatMoney(12.5, 'EUR')).toBe('€12.50');
    expect(formatMoney(10, 'GBP', 'en-GB')).toBe('£10');
  });
  it('extracts the currency symbol', () => {
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
  });
  it('parses donor input with commas, symbols and at most two decimals', () => {
    expect(parseAmount('25')).toBe(25);
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount('€ 40')).toBe(40);
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});
