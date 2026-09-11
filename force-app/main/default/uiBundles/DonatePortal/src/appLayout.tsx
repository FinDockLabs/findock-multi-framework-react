import { Link, Outlet } from 'react-router';
import { DonationConfigProvider, useDonationConfig } from '@/context/DonationConfigContext';
import { Logo } from '@/components/donate/Logo';

const FALLBACK_NAME = 'Tidewell Foundation';

function Header() {
  const { config } = useDonationConfig();
  const name = config?.organisationName ?? FALLBACK_NAME;
  return (
    <header>
      {/* Slim site bar */}
      <div className="border-b border-ink/15 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6">
          <a href="https://www.example.org" className="inline-flex min-h-8 items-center gap-1.5 text-paper/90 hover:text-paper">
            <span aria-hidden="true">←</span> {name.split(' ')[0]}.org
          </a>
          <span className="inline-flex items-center gap-1.5 text-paper/80">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Secure donation
          </span>
        </div>
      </div>
      {/* Organisation lockup */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-3 rounded-md">
          <Logo className="h-10 w-10" />
          <span className="font-display text-2xl font-semibold text-ink">{name}</span>
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">Registered charity · ANBI 0000 0000</span>
      </div>
    </header>
  );
}

function Footer() {
  const { config } = useDonationConfig();
  const name = config?.organisationName ?? FALLBACK_NAME;
  const supportEmail = config?.supportEmail ?? 'hello@tidewell.example';
  return (
    <footer className="mt-16 border-t border-ink/15 bg-paper-deep/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{name}</p>
          <p className="mt-2 text-muted-foreground">
            Registered charity · ANBI 0000 0000<br />
            Kanaalstraat 1, 3531 CA Utrecht, Netherlands
          </p>
        </div>
        <nav aria-label="Policies">
          <ul className="space-y-2">
            <li><a className="underline-offset-4 hover:underline" href="https://www.example.org/privacy">Privacy policy</a></li>
            <li><a className="underline-offset-4 hover:underline" href="https://www.example.org/terms">Terms</a></li>
            <li><a className="underline-offset-4 hover:underline" href="https://www.example.org/refunds">Refund &amp; cancellation policy</a></li>
          </ul>
        </nav>
        <div>
          <p className="font-medium text-ink">Need a hand?</p>
          <p className="mt-2 text-muted-foreground">
            Email <a className="text-ink underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a> and a real person will reply within one working day.
          </p>
          <p className="mt-4 text-muted-foreground">Payments are encrypted and processed securely via FinDock on Salesforce. We never see or store your card or bank details.</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-6 text-xs text-muted-foreground sm:px-6">© {new Date().getFullYear()} {name}</div>
    </footer>
  );
}

export default function AppLayout() {
  return (
    <DonationConfigProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </DonationConfigProvider>
  );
}
