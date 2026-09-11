import { Link } from 'react-router';
import { useDonationConfig } from '@/context/DonationConfigContext';

/** PSP failure / cancel return target. Nothing has been charged. */
export default function Failed() {
  const { config } = useDonationConfig();
  const supportEmail = config?.supportEmail ?? 'hello@tidewell.example';
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="reveal rounded-[1.75rem] border border-ink/10 bg-card p-7 text-center shadow-[0_24px_60px_-30px_rgba(18,48,44,0.45)] sm:p-10">
        <div aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-paper-deep text-3xl text-ink">
          ↩
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-ink sm:text-5xl">Your donation was not completed.</h1>
        <p className="mt-5 text-lg text-muted-foreground" role="alert">
          The payment was cancelled or could not be authorised. Nothing has been charged to you.
        </p>
        <p className="mt-3 text-muted-foreground">
          You can try again with a different payment method, or email{' '}
          <a className="text-ink underline underline-offset-4" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>{' '}
          and we will help.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-primary min-w-56">
            Try again
          </Link>
          <a href="https://www.example.org" className="btn-ghost">
            Back to the website
          </a>
        </div>
      </div>
    </div>
  );
}
