import { Outlet } from 'react-router';
import { DonationConfigProvider, useDonationConfig } from '@/context/DonationConfigContext';
import { SiteFooter, SiteHeader } from '@shared/react/canopy';
import { appUrl } from '@/lib/appUrl';

function Layout() {
  const { config } = useDonationConfig();
  const home = appUrl('/');
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        surface="React · FinDock API"
        surfaceTitle="A React app (Salesforce Multi-Framework) with its own form, calling the FinDock Payment API through Apex"
        homeHref={home}
        donateHref={`${home}#donate`}
      />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter surfaceNote="React form, FinDock Payment API" supportEmail={config?.supportEmail ?? undefined} donateHref={`${home}#donate`} />
    </div>
  );
}

export default function AppLayout() {
  return (
    <DonationConfigProvider>
      <Layout />
    </DonationConfigProvider>
  );
}
