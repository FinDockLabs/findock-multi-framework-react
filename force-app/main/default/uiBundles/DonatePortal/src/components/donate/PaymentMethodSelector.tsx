import type { PaymentMethodView } from '@/api/donation/types';
import { FieldError } from './FieldError';

interface PaymentMethodSelectorProps {
  methods: PaymentMethodView[];
  selected: PaymentMethodView | null;
  error?: string;
  legendId: string;
  errorId: string;
  onSelect: (method: PaymentMethodView) => void;
}

/**
 * FinDock: methods come from the org's live /PaymentMethods response (filtered server-side).
 * Row order is mandated: radio indicator → method logo (Processors[].image.svg) → label.
 */
export function PaymentMethodSelector({ methods, selected, error, legendId, errorId, onSelect }: PaymentMethodSelectorProps) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend id={legendId} className="text-base font-semibold text-ink">How would you like to pay?</legend>
      {methods.length === 0 ? (
        <p role="status" className="mt-3 rounded-xl border border-border bg-card p-4 text-muted-foreground">
          No payment methods are available for this gift type right now. Please try again later or contact us.
        </p>
      ) : (
        <div role="radiogroup" aria-labelledby={legendId} className="mt-3 grid gap-3">
          {methods.map(m => (
            <label key={m.name} className="choice">
              <input type="radio" name="paymentMethod" value={m.name} checked={selected?.name === m.name} onChange={() => onSelect(m)} className="choice-input" />
              <span className="choice-dot" />
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt=""
                  width="40"
                  height="26"
                  className="h-[26px] w-10 shrink-0 object-contain"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="font-medium text-ink">{m.label}</span>
            </label>
          ))}
        </div>
      )}
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
