import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from '@/routes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getBasename } from '@/lib/appUrl';
import './styles/global.css';

// The Experience site serves the app behind a dynamic base path (e.g. /donate).
// Salesforce injects it as SFDC_ENV.basePath; the router must use it, never a hardcoded value.
const router = createBrowserRouter(routes, { basename: getBasename() });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
