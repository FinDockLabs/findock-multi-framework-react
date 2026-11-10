export interface StepDef {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: StepDef[];
  current: number;
  onSelect: (step: number) => void;
}

/** Numbered progress with real buttons for completed steps (WCAG 2.4.7 / 4.1.2). */
export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  return (
    <nav aria-label="Donation steps">
      <ol className="flex items-center gap-2 text-sm">
        {steps.map((step, i) => {
          const done = step.id < current;
          const active = step.id === current;
          const circle = (
            <span
              aria-hidden="true"
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                active ? 'bg-ink text-paper' : done ? 'bg-moss text-white' : 'border border-border text-muted-foreground'
              }`}
            >
              {done ? '✓' : step.id}
            </span>
          );
          return (
            <li key={step.id} className="flex items-center gap-2">
              {done ? (
                <button type="button" onClick={() => onSelect(step.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full pr-2 text-ink hover:underline underline-offset-4">
                  {circle}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sr-only">(completed, go back)</span>
                </button>
              ) : (
                <span aria-current={active ? 'step' : undefined} className={`inline-flex min-h-11 items-center gap-2 ${active ? 'font-semibold text-ink' : 'text-muted-foreground'}`}>
                  {circle}
                  <span className={active ? '' : 'hidden sm:inline'}>{step.label}</span>
                </span>
              )}
              {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-border sm:w-8" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
