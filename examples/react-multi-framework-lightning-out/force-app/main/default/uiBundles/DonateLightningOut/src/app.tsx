import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { getBasename } from './appUrl';
import Layout from './Layout';
import Donate from './pages/Donate';
import ThankYou from './pages/ThankYou';
import Failed from './pages/Failed';
import './styles.css';

// The Experience site serves the app behind a base path (e.g. /donatelo); Salesforce injects it as SFDC_ENV.basePath.
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Donate /> },
        { path: 'thank-you', element: <ThankYou /> },
        { path: 'failed', element: <Failed /> },
        { path: '*', element: <Donate /> },
      ],
    },
  ],
  { basename: getBasename() },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
