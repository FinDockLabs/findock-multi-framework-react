// Sample data for the local Vite dev server only (no Salesforce session available there).
// Icons are the real FinDock CDN assets the live /PaymentMethods response points to.
import type { DonationConfig, IntentRequest, IntentResponse } from './types';

const icon = (name: string) => `https://external.findock.com/icon/payment-methods/${name}.svg`;

export function mockConfig(): Promise<DonationConfig> {
  const card = {
    name: 'CreditCard',
    label: 'Credit or debit card',
    processor: 'PaymentHub-Stripe',
    imageUrl: icon('creditcard'),
    supportsRecurring: true,
    initialPaymentOnRecurring: 'required',
    parameters: [],
  };
  const sepa = {
    name: 'SEPA Direct Debit',
    label: 'SEPA Direct Debit',
    processor: 'PaymentHub-Stripe',
    imageUrl: icon('sepadirectdebit'),
    supportsRecurring: true,
    initialPaymentOnRecurring: 'unsupported',
    parameters: [],
  };
  const ideal = {
    name: 'Ideal',
    label: 'iDEAL',
    processor: 'PaymentHub-Stripe',
    imageUrl: icon('ideal'),
    supportsRecurring: false,
    initialPaymentOnRecurring: 'unsupported',
    parameters: [
      {
        name: 'issuer',
        label: 'Your bank',
        description: 'Choose your bank to skip the bank selection screen.',
        dataType: 'Enum',
        required: false,
        options: [
          { value: 'abnamro', label: 'ABN AMRO', imageUrl: 'https://images.findock.com/issuers/abnamro/issuer.svg' },
          { value: 'ingbank', label: 'ING', imageUrl: 'https://images.findock.com/issuers/ingbank/issuer.svg' },
          { value: 'rabobank', label: 'Rabobank', imageUrl: 'https://images.findock.com/issuers/rabobank/issuer.svg' },
        ],
      },
    ],
  };
  return Promise.resolve({
    organisationName: 'Tidewell Foundation',
    currencyCode: 'EUR',
    minAmount: 1,
    maxAmount: 5000,
    supportEmail: 'hello@tidewell.example',
    oneTimePresets: [
      { amount: 10, impactHint: 'Safe water for a family for a week' },
      { amount: 25, impactHint: 'A rain filter for one household' },
      { amount: 50, impactHint: 'A school hand-washing station' },
      { amount: 100, impactHint: 'Repairs a village well pump' },
    ],
    recurringPresets: [
      { amount: 5, impactHint: 'Clean water for one child all year' },
      { amount: 10, impactHint: 'Filters for two families every month' },
      { amount: 20, impactHint: 'Keeps a community well maintained' },
    ],
    oneTimeMethods: [ideal, card, sepa],
    recurringMethods: [sepa, card],
  });
}

export async function mockCreateIntent(request: IntentRequest): Promise<IntentResponse> {
  await new Promise(r => setTimeout(r, 600));
  if (request.email.endsWith('@fail.test')) {
    return { status: 'failed', errors: [{ code: '999', message: 'The donation could not be started.' }] };
  }
  return { status: 'redirect', redirectUrl: request.successUrl, paymentIntentId: 'pi_mock', errors: [] };
}
