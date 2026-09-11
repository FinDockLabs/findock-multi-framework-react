// Mirrors the JSON contract of DonationPaymentResource (Apex REST, /services/apexrest/donate/v1/*).

export type Frequency = 'oneTime' | 'monthly';

export interface Preset {
  amount: number;
  impactHint?: string | null;
}

export interface ParameterOption {
  value: string;
  label: string;
  imageUrl?: string | null;
}

export interface ParameterView {
  name: string;
  label: string;
  description?: string | null;
  dataType?: string | null;
  required: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  options?: ParameterOption[] | null;
}

export interface PaymentMethodView {
  name: string;
  label: string;
  processor: string;
  imageUrl?: string | null;
  supportsRecurring: boolean;
  initialPaymentOnRecurring?: string | null;
  parameters: ParameterView[];
}

export interface DonationConfig {
  organisationName: string;
  currencyCode: string;
  minAmount: number;
  maxAmount: number;
  supportEmail?: string | null;
  oneTimePresets: Preset[];
  recurringPresets: Preset[];
  oneTimeMethods: PaymentMethodView[];
  recurringMethods: PaymentMethodView[];
}

export interface IntentRequest {
  frequency: Frequency;
  amount: number;
  paymentMethod: string;
  parameters: Record<string, string>;
  firstName?: string;
  lastName: string;
  email: string;
  campaignId?: string;
  successUrl: string;
  failureUrl: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string | null;
}

export type IntentStatus = 'redirect' | 'success' | 'recoverable' | 'invalid' | 'failed';

export interface IntentResponse {
  status: IntentStatus;
  redirectUrl?: string | null;
  paymentIntentId?: string | null;
  errors: ApiError[];
}
