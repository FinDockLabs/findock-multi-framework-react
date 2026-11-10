import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Donate from '@/pages/Donate';
import ThankYou from '@/pages/ThankYou';
import Failed from '@/pages/Failed';
import NotFound from '@/pages/NotFound';

// PSP return targets: the Apex wrapper only accepts return URLs on this site, and the page
// builds them at runtime with appUrl('/thank-you') / appUrl('/failed') so the site prefix survives.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Donate />, handle: { showInNavigation: true, label: 'Donate' } },
      { path: 'thank-you', element: <ThankYou /> },
      { path: 'failed', element: <Failed /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
