import type { Frequency, PaymentMethodView } from '@/api/donation/types';
import { formatMoney } from '@/lib/money';

export interface DonorDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateAmount(
  amount: number | null,
  min: number,
  max: number,
  currencyCode: string
): string | null {
  if (amount === null) return 'Enter an amount to give.';
  if (amount < min) return `The minimum gift is ${formatMoney(min, currencyCode)}.`;
  if (amount > max) return `Online gifts are capped at ${formatMoney(max, currencyCode)}. Please contact us for larger gifts.`;
  return null;
}

export function validateDetails(details: DonorDetails): FieldErrors {
  const errors: FieldErrors = {};
  if (details.firstName.trim().length > 40) errors.firstName = 'First name is too long.';
  if (!details.lastName.trim()) errors.lastName = 'Enter your last name.';
  else if (details.lastName.trim().length > 80) errors.lastName = 'Last name is too long.';
  const email = details.email.trim();
  if (!email) errors.email = 'Enter your email address so we can send your receipt.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address, like name@example.org.';
  return errors;
}

/** Validate method-specific parameters against what FinDock declared for the method/processor. */
export function validateParameters(
  method: PaymentMethodView | null,
  values: Record<string, string>
): FieldErrors {
  const errors: FieldErrors = {};
  if (!method) {
    errors.paymentMethod = 'Choose how you would like to pay.';
    return errors;
  }
  for (const p of method.parameters) {
    if (!p.required && !(p.options?.length ?? 0)) continue; // hidden merchant parameter
    const value = (values[p.name] ?? '').trim();
    const key = `parameters.${p.name}`;
    if (!value) {
      if (p.required) errors[key] = p.options?.length ? `Choose your ${p.label.toLowerCase()}.` : `Enter your ${p.label.toLowerCase()}.`;
      continue;
    }
    if (p.minLength && value.length < p.minLength) errors[key] = `${p.label} must be at least ${p.minLength} characters.`;
    if (p.maxLength && value.length > p.maxLength) errors[key] = `${p.label} must be at most ${p.maxLength} characters.`;
    if (p.dataType === 'Integer' && !/^\d+$/.test(value)) errors[key] = `${p.label} must be a whole number.`;
    if (p.options?.length && !p.options.some(o => o.value === value)) errors[key] = `Choose one of the listed options.`;
  }
  return errors;
}

export function frequencyLabel(frequency: Frequency): string {
  return frequency === 'monthly' ? 'monthly gift' : 'one-time gift';
}
