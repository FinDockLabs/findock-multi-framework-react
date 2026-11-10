import { Link } from 'react-router';
import { ResultPage } from '@shared/react/canopy';

export default function ThankYou() {
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
      <p role="status">Your donation is set up. A confirmation is on its way to your inbox. You're now one of the people keeping gibbons in the wild.</p>
    </ResultPage>
  );
}
