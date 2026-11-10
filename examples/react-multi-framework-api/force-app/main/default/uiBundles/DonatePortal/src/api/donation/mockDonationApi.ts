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
    organisationName: 'Canopy Gibbon Trust',
    currencyCode: 'EUR',
    minAmount: 1,
    maxAmount: 5000,
    supportEmail: 'hello@canopygibbons.example',
    oneTimePresets: [
      { amount: 10, impactHint: 'Fresh fruit for a rescued gibbon for a week' },
      { amount: 25, impactHint: 'Vet checks for the clinic' },
      { amount: 50, impactHint: 'A ranger patrol day' },
      { amount: 100, impactHint: 'Replanting forest corridors' },
    ],
    recurringPresets: [
      { amount: 5, impactHint: 'Fresh fruit every month' },
      { amount: 10, impactHint: 'Vet care for a rescued gibbon' },
      { amount: 20, impactHint: 'Keeps a ranger on patrol' },
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
