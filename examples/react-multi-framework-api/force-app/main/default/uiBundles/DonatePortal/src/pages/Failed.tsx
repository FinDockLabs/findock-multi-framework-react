import { Link } from 'react-router';
import { useDonationConfig } from '@/context/DonationConfigContext';
import { ResultPage } from '@shared/react/canopy';

/** PSP failure / cancel return target. Nothing has been charged. */
export default function Failed() {
  const { config } = useDonationConfig();
  const supportEmail = config?.supportEmail ?? 'hello@canopygibbons.example';
  return (
    <ResultPage
      variant="failed"
      title="Your payment didn't go through"
      actions={
        <>
          <Link className="button" to="/">
            Try again
          </Link>
          <a className="button light" href={`mailto:${supportEmail}`}>
            Contact us
          </a>
        </>
      }
    >
      <p role="alert">Nothing was charged. Please try again, or choose another payment method.</p>
    </ResultPage>
  );
}
