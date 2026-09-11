import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { createDonationIntent } from '@/api/donation/donationService';
import type { Frequency, IntentRequest, PaymentMethodView } from '@/api/donation/types';
import { useDonationConfig } from '@/context/DonationConfigContext';
import { appUrl } from '@/lib/appUrl';
import { validateAmount, validateDetails, validateParameters, type DonorDetails, type FieldErrors } from '@/lib/validation';
import { Hero } from '@/components/donate/Hero';
import { StepIndicator } from '@/components/donate/StepIndicator';
import { AmountStep } from '@/components/donate/AmountStep';
import { DetailsStep } from '@/components/donate/DetailsStep';
import { PaymentStep } from '@/components/donate/PaymentStep';

const STEPS = [
  { id: 1, label: 'Your gift' },
  { id: 2, label: 'Your details' },
  { id: 3, label: 'Payment' },
];

const GENERIC_FAILURE = 'We could not start your donation just now.';

export default function Donate() {
  const { config, loading, error: configError } = useDonationConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const campaignId = useMemo(() => new URLSearchParams(location.search).get('campaign') ?? undefined, [location.search]);

  const [step, setStep] = useState(1);
  const [frequency, setFrequency] = useState<Frequency>('oneTime');
  const [amount, setAmount] = useState<number | null>(25);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [details, setDetails] = useState<DonorDetails>({ firstName: '', lastName: '', email: '' });
  const [detailErrors, setDetailErrors] = useState<FieldErrors>({});
  const [method, setMethod] = useState<PaymentMethodView | null>(null);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const methods = useMemo(() => (config ? (frequency === 'monthly' ? config.recurringMethods : config.oneTimeMethods) : []), [config, frequency]);

  // A method chosen for one frequency may not be offered for the other; derive rather than sync.
  const selectedMethod = method && methods.some(m => m.name === method.name) ? method : null;

  const goTo = useCallback((next: number) => {
    setStep(next);
    setFailure(null);
    setAnnouncement(`Step ${next} of ${STEPS.length}: ${STEPS[next - 1].label}`);
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      cardRef.current?.querySelector<HTMLElement>('h2, legend')?.focus?.();
    });
  }, []);

  const handleFrequency = (f: Frequency) => {
    setFrequency(f);
    setMethod(null);
    setParameterValues({});
    setPaymentErrors({});
    const presets = f === 'monthly' ? config?.recurringPresets : config?.oneTimePresets;
    if (presets && presets.length && !(amount !== null && presets.some(p => p.amount === amount))) {
      setAmount(presets[Math.min(1, presets.length - 1)].amount);
    }
    setAmountError(undefined);
  };

  const continueFromAmount = () => {
    if (!config) return;
    const err = validateAmount(amount, config.minAmount, config.maxAmount, config.currencyCode);
    setAmountError(err ?? undefined);
    if (!err) goTo(2);
  };

  const continueFromDetails = () => {
    const errs = validateDetails(details);
    setDetailErrors(errs);
    if (Object.keys(errs).length === 0) goTo(3);
  };

  const blurDetail = (field: keyof DonorDetails) => {
    const errs = validateDetails(details);
    setDetailErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const submit = async () => {
    if (!config || amount === null) return;
    const errs = validateParameters(selectedMethod, parameterValues);
    setPaymentErrors(errs);
    if (Object.keys(errs).length > 0 || !selectedMethod) return;

    setSubmitting(true);
    setFailure(null);
    setAnnouncement('Preparing your secure payment.');

    // FinDock: return URLs are built from the current page so the site path prefix survives the PSP round-trip.
    const request: IntentRequest = {
      frequency,
      amount,
      paymentMethod: selectedMethod.name,
      parameters: Object.fromEntries(Object.entries(parameterValues).filter(([, v]) => v.trim() !== '')),
      firstName: details.firstName.trim() || undefined,
      lastName: details.lastName.trim(),
      email: details.email.trim(),
      campaignId,
      successUrl: appUrl('/thank-you'),
      failureUrl: appUrl('/failed'),
    };

    const result = await createDonationIntent(request);
    switch (result.status) {
      case 'redirect':
        // FinDock: hand the donor to the PSP hosted page; card/bank details are captured there.
        window.location.assign(result.redirectUrl!);
        return;
      case 'success':
        navigate(`/thank-you?inline=1${result.paymentIntentId ? `&ref=${encodeURIComponent(result.paymentIntentId)}` : ''}`);
        return;
      case 'recoverable':
      case 'invalid': {
        // Field-level problems: put the message next to the field and send the donor to that step.
        const fieldErrors: FieldErrors = {};
        let earliestStep = 3;
        for (const e of result.errors) {
          const field = e.field ?? '';
          if (field === 'amount' || field === 'frequency') earliestStep = Math.min(earliestStep, 1);
          else if (['firstName', 'lastName', 'email'].includes(field)) earliestStep = Math.min(earliestStep, 2);
          if (field) fieldErrors[field] = e.message;
        }
        if (fieldErrors.amount) setAmountError(fieldErrors.amount);
        setDetailErrors(Object.fromEntries(Object.entries(fieldErrors).filter(([k]) => ['firstName', 'lastName', 'email'].includes(k))));
        setPaymentErrors(Object.fromEntries(Object.entries(fieldErrors).filter(([k]) => k.startsWith('parameters.') || k === 'paymentMethod')));
        if (Object.keys(fieldErrors).length === 0) setFailure(GENERIC_FAILURE);
        setSubmitting(false);
        goTo(earliestStep);
        return;
      }
      default:
        setFailure(GENERIC_FAILURE);
        setSubmitting(false);
        setAnnouncement(GENERIC_FAILURE);
    }
  };

  const organisationName = config?.organisationName ?? 'Tidewell Foundation';

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6 lg:pt-10">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_minmax(22rem,30rem)] lg:gap-14">
        <Hero organisationName={organisationName} />

        <div ref={cardRef} className="scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
          <section aria-labelledby="form-heading" className="reveal rounded-[1.75rem] border border-ink/10 bg-card p-5 shadow-[0_24px_60px_-30px_rgba(18,48,44,0.45)] sm:p-7" style={{ animationDelay: '120ms' }}>
            <h2 id="form-heading" className="sr-only">
              Donation form
            </h2>
            <StepIndicator steps={STEPS} current={step} onSelect={goTo} />
            <div className="mt-6">
              {loading && (
                <div role="status" className="space-y-4 py-6" aria-label="Loading donation options">
                  <div className="h-8 w-2/3 animate-pulse rounded-lg bg-paper-deep" />
                  <div className="h-12 animate-pulse rounded-full bg-paper-deep" />
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="h-20 animate-pulse rounded-xl bg-paper-deep" />
                    ))}
                  </div>
                </div>
              )}
              {!loading && (configError || !config) && (
                <div role="alert" className="rounded-xl border-2 border-destructive/60 p-4">
                  <p className="font-semibold text-destructive">The donation form could not load.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Please refresh the page. If it keeps happening, email us and we will help you give another way.</p>
                </div>
              )}
              {!loading && config && step === 1 && (
                <AmountStep
                  currencyCode={config.currencyCode}
                  frequency={frequency}
                  amount={amount}
                  presets={{ oneTime: config.oneTimePresets, monthly: config.recurringPresets }}
                  minAmount={config.minAmount}
                  maxAmount={config.maxAmount}
                  error={amountError}
                  onFrequencyChange={handleFrequency}
                  onAmountChange={(a, custom) => {
                    setAmount(a);
                    if (!custom || a !== null) setAmountError(undefined);
                  }}
                  onContinue={continueFromAmount}
                />
              )}
              {!loading && config && step === 2 && (
                <DetailsStep details={details} errors={detailErrors} onChange={setDetails} onBlurField={blurDetail} onBack={() => goTo(1)} onContinue={continueFromDetails} />
              )}
              {!loading && config && step === 3 && amount !== null && (
                <PaymentStep
                  currencyCode={config.currencyCode}
                  frequency={frequency}
                  amount={amount}
                  details={details}
                  methods={methods}
                  selected={selectedMethod}
                  parameterValues={parameterValues}
                  errors={paymentErrors}
                  submitting={submitting}
                  failure={failure}
                  supportEmail={config.supportEmail}
                  onSelectMethod={m => {
                    setMethod(m);
                    setParameterValues({});
                    setPaymentErrors({});
                    setFailure(null);
                  }}
                  onParameterChange={(name, value) => {
                    setParameterValues(prev => ({ ...prev, [name]: value }));
                    setPaymentErrors(prev => {
                      const next = { ...prev };
                      delete next[`parameters.${name}`];
                      return next;
                    });
                  }}
                  onEdit={goTo}
                  onBack={() => goTo(2)}
                  onSubmit={submit}
                />
              )}
            </div>
          </section>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <li>🔒 Encrypted &amp; PCI-compliant</li>
            <li>📧 Instant receipt</li>
            <li>↩️ Monthly gifts cancel any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
