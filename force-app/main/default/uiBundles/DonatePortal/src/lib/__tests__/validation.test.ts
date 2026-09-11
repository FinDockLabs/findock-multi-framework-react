import { describe, expect, it } from 'vitest';
import type { PaymentMethodView } from '@/api/donation/types';
import { validateAmount, validateDetails, validateParameters } from '../validation';

const ideal: PaymentMethodView = {
  name: 'Ideal',
  label: 'iDEAL',
  processor: 'PaymentHub-Stripe',
  supportsRecurring: false,
  parameters: [
    { name: 'issuer', label: 'Your bank', required: false, dataType: 'Enum', options: [{ value: 'abnamro', label: 'ABN AMRO' }] },
  ],
};
const sepa: PaymentMethodView = {
  name: 'SEPA Direct Debit',
  label: 'SEPA Direct Debit',
  processor: 'PaymentHub-Stripe',
  supportsRecurring: true,
  parameters: [{ name: 'iban', label: 'IBAN', required: true, dataType: 'String', minLength: 15, maxLength: 34 }],
};

describe('validateAmount', () => {
  it('enforces the configured bounds with currency in the message', () => {
    expect(validateAmount(null, 1, 5000, 'EUR')).toMatch(/Enter an amount/);
    expect(validateAmount(0.5, 1, 5000, 'EUR')).toMatch(/€1/);
    expect(validateAmount(6000, 1, 5000, 'EUR')).toMatch(/€5,000/);
    expect(validateAmount(25, 1, 5000, 'EUR')).toBeNull();
  });
});

describe('validateDetails', () => {
  it('requires last name and a plausible email; first name optional', () => {
    expect(validateDetails({ firstName: '', lastName: '', email: '' })).toEqual({
      lastName: expect.stringMatching(/last name/),
      email: expect.stringMatching(/email/),
    });
    expect(validateDetails({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example' })).toHaveProperty('email');
    expect(validateDetails({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' })).toEqual({});
  });
});

describe('validateParameters', () => {
  it('requires a method', () => {
    expect(validateParameters(null, {})).toHaveProperty('paymentMethod');
  });
  it('allows optional enum to be blank but rejects unknown values', () => {
    expect(validateParameters(ideal, {})).toEqual({});
    expect(validateParameters(ideal, { issuer: 'rabobank' })).toHaveProperty('parameters.issuer');
    expect(validateParameters(ideal, { issuer: 'abnamro' })).toEqual({});
  });
  it('enforces required string parameters and length constraints from the response', () => {
    expect(validateParameters(sepa, {})['parameters.iban']).toMatch(/Enter your iban/i);
    expect(validateParameters(sepa, { iban: 'NL91' })['parameters.iban']).toMatch(/at least 15/);
    expect(validateParameters(sepa, { iban: 'NL91ABNA0417164300' })).toEqual({});
  });
});
