import type { ParameterView } from '@/api/donation/types';
import type { FieldErrors } from '@/lib/validation';
import { FieldError } from './FieldError';

interface ParameterFieldsProps {
  parameters: ParameterView[];
  values: Record<string, string>;
  errors: FieldErrors;
  idPrefix: string;
  onChange: (name: string, value: string) => void;
}

/**
 * FinDock: render each parameter declared for the chosen method/processor.
 * Enum parameters (iDEAL issuer, card brand, account type) become a visual radio picker using
 * the response's label + image.svg and submit the option's value. Strings/integers become inputs
 * with the response's min/max lengths. Nothing here is hardcoded per method.
 */
/** Optional free-text parameters (locale, itemName, description) are merchant concerns the Apex wrapper fills; donors never see them. */
export function donorVisibleParameters(parameters: ParameterView[]): ParameterView[] {
  return parameters.filter(p => p.required || (p.options?.length ?? 0) > 0);
}

export function ParameterFields({ parameters, values, errors, idPrefix, onChange }: ParameterFieldsProps) {
  const visible = donorVisibleParameters(parameters);
  if (visible.length === 0) return null;
  return (
    <div className="space-y-5">
      {visible.map(p => {
        const id = `${idPrefix}-${p.name}`;
        const errId = `${id}-err`;
        const descId = `${id}-desc`;
        const key = `parameters.${p.name}`;
        const error = errors[key];
        const described = [p.description ? descId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;

        if (p.options && p.options.length > 0) {
          return (
            <fieldset key={p.name} aria-describedby={described}>
              <legend className="text-sm font-medium text-ink">
                {p.label}
                {!p.required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
              </legend>
              {p.description && (
                <p id={descId} className="mt-1 text-sm text-muted-foreground">
                  {p.description}
                </p>
              )}
              <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-2">
                {p.options.map(o => (
                  <label key={o.value} className="choice min-h-11 py-2">
                    <input type="radio" name={key} value={o.value} checked={values[p.name] === o.value} onChange={() => onChange(p.name, o.value)} className="choice-input" />
                    <span className="choice-dot" />
                    {o.imageUrl && (
                      <img
                        src={o.imageUrl}
                        alt=""
                        width="28"
                        height="28"
                        className="h-7 w-7 shrink-0 rounded object-contain"
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-ink">{o.label}</span>
                  </label>
                ))}
              </div>
              <FieldError id={errId} message={error} />
            </fieldset>
          );
        }

        const isInt = p.dataType === 'Integer';
        return (
          <div key={p.name}>
            <label htmlFor={id} className="block text-sm font-medium text-ink">
              {p.label}
              {!p.required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
            </label>
            {p.description && (
              <p id={descId} className="mt-1 text-sm text-muted-foreground">
                {p.description}
              </p>
            )}
            <input
              id={id}
              type="text"
              inputMode={isInt ? 'numeric' : p.name.toLowerCase() === 'iban' ? 'text' : undefined}
              autoComplete="off"
              autoCapitalize={p.name.toLowerCase() === 'iban' ? 'characters' : undefined}
              minLength={p.minLength ?? undefined}
              maxLength={p.maxLength ?? undefined}
              required={p.required}
              aria-required={p.required || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={described}
              value={values[p.name] ?? ''}
              onChange={e => onChange(p.name, e.target.value)}
              className="field-input mt-1.5"
            />
            <FieldError id={errId} message={error} />
          </div>
        );
      })}
    </div>
  );
}
