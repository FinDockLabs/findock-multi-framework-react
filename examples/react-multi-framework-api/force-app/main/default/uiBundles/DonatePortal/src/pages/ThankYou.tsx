import { Link, useLocation } from 'react-router';
import { ResultPage } from '@shared/react/canopy';

/** PSP success return target (and inline success for methods that do not redirect). */
export default function ThankYou() {
  const inline = new URLSearchParams(useLocation().search).get('inline') === '1';
  return (
    <ResultPage
      variant="success"
      title="Thank you for your gift"
      actions={
        <>
          <a className="button" href="https://www.example.org">
            Back to canopygibbons.org
          </a>
          <Link className="button light" to="/">
            Make another gift
          </Link>
        </>
      }
    >
      <p role="status">
        {inline
          ? 'Your donation is set up. A confirmation is on its way to your inbox.'
          : 'Your payment was completed. A receipt is on its way to your inbox; it can take a few minutes to arrive.'}{' '}
        You're now one of the people keeping gibbons in the wild.
      </p>
    </ResultPage>
  );
}
