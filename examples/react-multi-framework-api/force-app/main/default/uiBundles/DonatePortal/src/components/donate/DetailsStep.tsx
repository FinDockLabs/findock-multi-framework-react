import { useId } from 'react';
import type { DonorDetails, FieldErrors } from '@/lib/validation';
import { FieldError } from './FieldError';

interface DetailsStepProps {
  details: DonorDetails;
  errors: FieldErrors;
  onChange: (details: DonorDetails) => void;
  onBlurField: (field: keyof DonorDetails) => void;
  onBack: () => void;
  onContinue: () => void;
}

const FIELDS: { key: keyof DonorDetails; label: string; autoComplete: string; type: string; required: boolean; hint?: string }[] = [
  { key: 'firstName', label: 'First name', autoComplete: 'given-name', type: 'text', required: false, hint: 'Optional' },
  { key: 'lastName', label: 'Last name', autoComplete: 'family-name', type: 'text', required: true },
  { key: 'email', label: 'Email address', autoComplete: 'email', type: 'email', required: true, hint: 'We send your receipt here. No newsletters unless you ask.' },
];

export function DetailsStep({ details, errors, onChange, onBlurField, onBack, onContinue }: DetailsStepProps) {
  const base = useId();
  return (
    <form
      className="reveal space-y-6"
      noValidate
      onSubmit={e => {
        e.preventDefault();
        onContinue();
      }}
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Tell us who you are</h2>
        <p className="mt-1 text-muted-foreground">Just enough to send a receipt and say thank you.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map(f => {
          const id = `${base}-${f.key}`;
          const errId = `${id}-err`;
          const hintId = `${id}-hint`;
          const error = errors[f.key];
          const described = [f.hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
          return (
            <div key={f.key} className={f.key === 'email' ? 'sm:col-span-2' : ''}>
              <label htmlFor={id} className="block text-sm font-medium text-ink">
                {f.label}
                {!f.required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
              </label>
              <input
                id={id}
                type={f.type}
                inputMode={f.type === 'email' ? 'email' : undefined}
                autoComplete={f.autoComplete}
                required={f.required}
                aria-required={f.required || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={described}
                value={details[f.key]}
                onChange={e => onChange({ ...details, [f.key]: e.target.value })}
                onBlur={() => onBlurField(f.key)}
                className="field-input mt-1.5"
              />
              {f.hint && !error && (
                <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
                  {f.hint}
                </p>
              )}
              <FieldError id={errId} message={error} />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost">
          <span aria-hidden="true">←</span> Back
        </button>
        <button type="submit" className="btn-primary sm:min-w-56">
          Continue to payment <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
