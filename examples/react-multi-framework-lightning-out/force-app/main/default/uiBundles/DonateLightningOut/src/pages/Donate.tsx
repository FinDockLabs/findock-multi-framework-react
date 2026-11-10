import { FaqSection, HeroSection, QuoteBand, WorkSection } from '@shared/react/canopy';
import { LightningOutEmbed } from '@shared/react/LightningOutEmbed';
import { LIGHTNING_OUT } from '../config';
import { appUrl } from '../appUrl';

/**
 * The page is React; the donation form is the Donation_Flow in Salesforce, rendered by the c-donation-flow
 * wrapper component through Lightning Out. Hosted payments (iDEAL, PayPal, ...) return to the React routes below.
 */
export default function Donate() {
  return (
    <main>
      <HeroSection>
        <LightningOutEmbed
          config={LIGHTNING_OUT}
          component="c-donation-flow"
          attributes={{ 'success-url': appUrl('/thank-you'), 'failure-url': appUrl('/failed') }}
        />
      </HeroSection>
      <WorkSection />
      <QuoteBand />
      <FaqSection />
    </main>
  );
}
