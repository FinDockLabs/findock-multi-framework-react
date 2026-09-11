import { describe, expect, it } from 'vitest';
import { normaliseIntentResponse } from '../donationService';

describe('normaliseIntentResponse', () => {
  it('passes through redirect with url', () => {
    const r = normaliseIntentResponse({ status: 'redirect', redirectUrl: 'https://psp.test/x', paymentIntentId: 'pi_1', errors: [] }, 200);
    expect(r.status).toBe('redirect');
    expect(r.redirectUrl).toBe('https://psp.test/x');
  });
  it('treats redirect without url as failed', () => {
    expect(normaliseIntentResponse({ status: 'redirect', errors: [] }, 200).status).toBe('failed');
  });
  it('keeps recoverable and invalid field errors', () => {
    const r = normaliseIntentResponse({ status: 'recoverable', errors: [{ code: '202', message: 'IBAN invalid', field: 'parameters.iban' }] }, 200);
    expect(r.status).toBe('recoverable');
    expect(r.errors[0].field).toBe('parameters.iban');
    expect(normaliseIntentResponse({ status: 'invalid', errors: [{ code: 'invalid', message: 'x', field: 'amount' }] }, 400).status).toBe('invalid');
  });
  it('maps unknown bodies and HTTP failures to a generic failed outcome', () => {
    const r = normaliseIntentResponse(null, 502);
    expect(r.status).toBe('failed');
    expect(r.errors[0].code).toBe('502');
  });
});
