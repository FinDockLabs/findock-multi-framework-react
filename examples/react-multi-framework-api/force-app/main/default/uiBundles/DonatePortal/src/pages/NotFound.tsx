import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">404</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">That page has run dry.</h1>
      <p className="mt-4 text-muted-foreground">The link may be old or mistyped. The donation form is still right here.</p>
      <Link to="/" className="btn-primary mt-8 inline-flex min-w-56">
        Go to the donation form
      </Link>
    </div>
  );
}
