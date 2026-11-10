import { Outlet } from 'react-router';
import { SiteFooter, SiteHeader } from '@shared/react/canopy';
import { appUrl } from './appUrl';

export default function Layout() {
  const home = appUrl('/');
  return (
    <>
      <SiteHeader
        surface="React · Lightning Out"
        surfaceTitle="A React app (Salesforce Multi-Framework) that embeds the Salesforce Donation Flow with Lightning Out 2.0"
        homeHref={home}
        donateHref={`${home}#donate`}
      />
      <Outlet />
      <SiteFooter surfaceNote="Salesforce flow, embedded in React with Lightning Out 2.0" donateHref={`${home}#donate`} />
    </>
  );
}
