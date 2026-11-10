import { Link } from 'react-router';
import { ResultPage } from '@shared/react/canopy';

export default function Failed() {
  return (
    <ResultPage
      variant="failed"
      title="Your payment didn't go through"
      actions={
        <>
          <Link className="button" to="/">
            Try again
          </Link>
          <a className="button light" href="mailto:hello@canopygibbons.example">
            Contact us
          </a>
        </>
      }
    >
      <p role="alert">Nothing was charged. Please try again, or choose another payment method.</p>
    </ResultPage>
  );
}
