import { useId, useState } from 'react';
import type { Frequency, Preset } from '@/api/donation/types';
import { currencySymbol, formatMoney, parseAmount } from '@/lib/money';
import { FieldError } from './FieldError';

interface AmountStepProps {
  currencyCode: string;
  frequency: Frequency;
  amount: number | null;
  presets: Record<Frequency, Preset[]>;
  minAmount: number;
  maxAmount: number;
  error?: string;
  onFrequencyChange: (f: Frequency) => void;
  onAmountChange: (amount: number | null, custom: boolean) => void;
  onContinue: () => void;
}

export function AmountStep({ currencyCode, frequency, amount, presets, minAmount, maxAmount, error, onFrequencyChange, onAmountChange, onContinue }: AmountStepProps) {
  const ids = { freq: useId(), amount: useId(), custom: useId(), err: useId(), help: useId() };
  const list = presets[frequency];
  const presetSelected = amount !== null && list.some(p => p.amount === amount);
  const [customText, setCustomText] = useState(amount !== null && !presetSelected ? String(amount) : '');
  const symbol = currencySymbol(currencyCode);

  const handleCustom = (raw: string) => {
    setCustomText(raw);
    onAmountChange(parseAmount(raw), true);
  };

  return (
    <form
      className="reveal space-y-7"
      noValidate
      onSubmit={e => {
        e.preventDefault();
        onContinue();
      }}
    >
      <fieldset>
        <legend id={ids.freq} className="font-display text-2xl font-semibold text-ink">How would you like to give?</legend>
        <div role="radiogroup" aria-labelledby={ids.freq} className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-paper-deep p-1">
          {(['oneTime', 'monthly'] as Frequency[]).map(f => (
            <label key={f} className={`relative grid min-h-11 cursor-pointer place-items-center rounded-full text-center font-medium transition-colors ${frequency === f ? 'bg-ink text-paper shadow-sm' : 'text-ink hover:bg-paper'}`}>
              <input type="radio" name="frequency" value={f} checked={frequency === f} onChange={() => onFrequencyChange(f)} className="choice-input" />
              {f === 'oneTime' ? 'Give once' : 'Give monthly'}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{frequency === 'monthly' ? 'Cancel or change any time. Monthly gifts keep the technicians in the field all year.' : 'A single gift, receipted straight to your inbox.'}</p>
      </fieldset>

      <fieldset aria-describedby={error ? ids.err : undefined}>
        <legend id={ids.amount} className="text-base font-semibold text-ink">Choose an amount</legend>
        <div role="radiogroup" aria-labelledby={ids.amount} className="mt-3 grid grid-cols-2 gap-3">
          {list.map(p => (
            <label key={p.amount} className="choice amount-tile">
              <input
                type="radio"
                name="amount"
                value={p.amount}
                checked={amount === p.amount && presetSelected}
                onChange={() => {
                  setCustomText('');
                  onAmountChange(p.amount, false);
                }}
                className="choice-input"
              />
              <span className="font-display text-2xl font-semibold leading-none">
                {formatMoney(p.amount, currencyCode)}
                {frequency === 'monthly' && <span className="text-sm font-normal">/mo</span>}
              </span>
              {p.impactHint && <span className="amount-hint">{p.impactHint}</span>}
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor={ids.custom} className="block text-sm font-medium text-ink">
            Or enter another amount
          </label>
          <div className="mt-1.5 flex items-stretch overflow-hidden rounded-xl border-[1.5px] border-input bg-card focus-within:outline focus-within:outline-3 focus-within:outline-moss focus-within:outline-offset-2">
            <span aria-hidden="true" className="grid w-12 place-items-center border-r border-input bg-paper-deep/60 font-semibold text-ink">
              {symbol}
            </span>
            <input
              id={ids.custom}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={customText}
              onChange={e => handleCustom(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${ids.help}${error ? ` ${ids.err}` : ''}`}
              className="min-h-12 flex-1 bg-transparent px-3 text-lg outline-none"
            />
            {frequency === 'monthly' && <span className="grid place-items-center pr-4 text-sm text-muted-foreground">per month</span>}
          </div>
          <p id={ids.help} className="mt-1.5 text-sm text-muted-foreground">
            Between {formatMoney(minAmount, currencyCode)} and {formatMoney(maxAmount, currencyCode)}.
          </p>
          <FieldError id={ids.err} message={error} />
        </div>
      </fieldset>

      <button type="submit" className="btn-primary w-full">
        Continue{amount ? ` with ${formatMoney(amount, currencyCode)}${frequency === 'monthly' ? ' a month' : ''}` : ''}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
