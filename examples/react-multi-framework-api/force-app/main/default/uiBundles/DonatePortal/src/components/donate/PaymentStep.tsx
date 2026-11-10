import { useId } from 'react';
import type { Frequency, PaymentMethodView } from '@/api/donation/types';
import type { DonorDetails, FieldErrors } from '@/lib/validation';
import { formatMoney } from '@/lib/money';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { ParameterFields } from './ParameterFields';

interface PaymentStepProps {
  currencyCode: string;
  frequency: Frequency;
  amount: number;
  details: DonorDetails;
  methods: PaymentMethodView[];
  selected: PaymentMethodView | null;
  parameterValues: Record<string, string>;
  errors: FieldErrors;
  submitting: boolean;
  failure: string | null;
  supportEmail?: string | null;
  onSelectMethod: (m: PaymentMethodView) => void;
  onParameterChange: (name: string, value: string) => void;
  onEdit: (step: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function PaymentStep(props: PaymentStepProps) {
  const { currencyCode, frequency, amount, details, methods, selected, parameterValues, errors, submitting, failure, supportEmail, onSelectMethod, onParameterChange, onEdit, onBack, onSubmit } = props;
  const ids = { legend: useId(), methodErr: useId(), params: useId(), failure: useId() };
  const monthly = frequency === 'monthly';
  const money = formatMoney(amount, currencyCode);
  const initialCharge = monthly && selected?.initialPaymentOnRecurring === 'required';

  return (
    <form
      className="reveal space-y-7"
      noValidate
      aria-describedby={failure ? ids.failure : undefined}
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Complete your gift</h2>
        {/* Summary instead of re-asking anything (WCAG 3.3.7) */}
        <dl className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/15 bg-paper-deep/40 text-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <dt className="text-muted-foreground">Gift</dt>
            <dd className="flex items-center gap-3 font-medium text-ink">
              {money} {monthly ? 'every month' : 'once'}
              <button type="button" onClick={() => onEdit(1)} className="text-sm underline underline-offset-4">
                Edit<span className="sr-only"> amount</span>
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <dt className="text-muted-foreground">Receipt to</dt>
            <dd className="flex min-w-0 items-center gap-3 font-medium text-ink">
              <span className="truncate">{details.email}</span>
              <button type="button" onClick={() => onEdit(2)} className="shrink-0 text-sm underline underline-offset-4">
                Edit<span className="sr-only"> details</span>
              </button>
            </dd>
          </div>
        </dl>
      </div>

      <PaymentMethodSelector methods={methods} selected={selected} error={errors.paymentMethod} legendId={ids.legend} errorId={ids.methodErr} onSelect={onSelectMethod} />

      {selected && <ParameterFields parameters={selected.parameters} values={parameterValues} errors={errors} idPrefix={ids.params} onChange={onParameterChange} />}

      {initialCharge && (
        <p role="note" className="rounded-xl bg-paper-deep/60 px-4 py-3 text-sm text-ink">
          Your first {money} is collected today to set up the mandate; the monthly gift then continues from next month.
        </p>
      )}

      {failure && (
        <div id={ids.failure} role="alert" className="rounded-xl border-2 border-destructive/60 bg-card px-4 py-3 text-sm text-ink">
          <p className="font-semibold text-destructive">{failure}</p>
          <p className="mt-1 text-muted-foreground">
            Nothing has been charged. Please try again{supportEmail ? <>, or email <a className="text-ink underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a> if it keeps happening</> : null}.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button type="submit" className="btn-primary w-full" disabled={submitting || methods.length === 0} aria-busy={submitting || undefined}>
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Preparing secure payment…
            </>
          ) : monthly ? (
            `Start monthly gift of ${money}`
          ) : (
            `Donate ${money}`
          )}
        </button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <svg aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>
            You will be taken to {selected ? `${selected.label.replace(/^Credit or debit card$/, 'our card processor')}` : 'a secure page'} to finish. Card and bank details are entered there and never touch this site. By donating you agree to our{' '}
            <a className="underline underline-offset-4" href="https://www.example.org/terms">terms</a> and{' '}
            <a className="underline underline-offset-4" href="https://www.example.org/privacy">privacy policy</a>.
          </span>
        </p>
        <button type="button" onClick={onBack} className="btn-ghost" disabled={submitting}>
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
    </form>
  );
}
