import { Link, useLocation } from 'react-router';
import { useDonationConfig } from '@/context/DonationConfigContext';

/** PSP success return target (and inline success for methods that do not redirect). */
export default function ThankYou() {
  const { config } = useDonationConfig();
  const params = new URLSearchParams(useLocation().search);
  const inline = params.get('inline') === '1';
  const name = config?.organisationName ?? 'Tidewell Foundation';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="reveal rounded-[1.75rem] border border-ink/10 bg-card p-7 text-center shadow-[0_24px_60px_-30px_rgba(18,48,44,0.45)] sm:p-10">
        <div aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-moss text-3xl text-white">
          ✓
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-clay">Thank you</p>
        <h1 className="mt-2 text-4xl font-semibold text-ink sm:text-5xl">Your gift is on its way to the field.</h1>
        <p className="mt-5 text-lg text-muted-foreground" role="status">
          {inline
            ? 'Your payment has been set up. You will receive a confirmation and receipt by email shortly.'
            : 'Your payment was completed. A receipt is on its way to your inbox; it can take a few minutes to arrive.'}
        </p>
        <dl className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {[
            ['Today', 'Receipt lands in your inbox.'],
            ['This month', `${name} allocates your gift to the next water point in the queue.`],
            ['Within a year', 'You hear from the community your gift reached.'],
          ].map(([when, what]) => (
            <div key={when} className="rounded-xl bg-paper-deep/50 p-4">
              <dt className="text-sm font-semibold text-ink">{when}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{what}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href="https://www.example.org" className="btn-primary min-w-56">
            Back to {name.split(' ')[0]}.org
          </a>
          <Link to="/" className="btn-ghost">
            Make another gift
          </Link>
        </div>
      </div>
    </div>
  );
}
