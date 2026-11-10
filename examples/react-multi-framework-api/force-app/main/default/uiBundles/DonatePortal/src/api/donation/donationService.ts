/**
 * Data layer for the donation page.
 *
 * Talks to the Apex REST wrapper (DonationPaymentResource) over the authenticated UI Bundle
 * SDK fetch — the same session the platform uses, so no token, proxy or CORS is involved.
 * FinDock itself is only ever called server-side by that wrapper.
 */
import { createDataSDK } from '@salesforce/platform-sdk';
import type { DonationConfig, IntentRequest, IntentResponse } from './types';
import { mockConfig, mockCreateIntent } from './mockDonationApi';

const BASE = '/services/apexrest/donate/v1';

async function platformFetch(path: string, init?: RequestInit): Promise<Response> {
  const sdk = await createDataSDK();
  if (!sdk.fetch) {
    throw new Error('Platform fetch is not available in this surface.');
  }
  return sdk.fetch(`${BASE}${path}`, init);
}

function shouldUseMock(): boolean {
  // `npm run dev` serves sample data by default so the UI can be worked on without an org session.
  // Set VITE_DONATION_API=org to let the Vite UI-bundle proxy forward calls to the default org instead.
  // Production builds (DEV=false) always talk to the platform.
  return import.meta.env.DEV && import.meta.env.VITE_DONATION_API !== 'org';
}

export async function fetchDonationConfig(): Promise<DonationConfig> {
  if (shouldUseMock()) return mockConfig();
  const res = await platformFetch('/config', { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Could not load donation settings (HTTP ${res.status}).`);
  }
  return (await res.json()) as DonationConfig;
}

/**
 * Create the FinDock PaymentIntent via Apex. Never throws for business outcomes: the wrapper
 * already normalised FinDock's answer into one of redirect | success | recoverable | invalid | failed.
 * Network or unexpected failures resolve to `failed` so the caller always has a route.
 */
export async function createDonationIntent(request: IntentRequest): Promise<IntentResponse> {
  if (shouldUseMock()) return mockCreateIntent(request);
  try {
    const res = await platformFetch('/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const body = (await res.json().catch(() => null)) as Partial<IntentResponse> | null;
    return normaliseIntentResponse(body, res.status);
  } catch (err) {
    console.error('Donation intent request failed', err);
    return { status: 'failed', errors: [{ code: 'network', message: 'The donation could not be started.' }] };
  }
}

export function normaliseIntentResponse(body: Partial<IntentResponse> | null, httpStatus: number): IntentResponse {
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const status = body?.status;
  if (status === 'redirect' && body?.redirectUrl) {
    return { status, redirectUrl: body.redirectUrl, paymentIntentId: body.paymentIntentId ?? null, errors };
  }
  if (status === 'success') {
    return { status, paymentIntentId: body?.paymentIntentId ?? null, errors };
  }
  if (status === 'recoverable' || status === 'invalid') {
    return { status, errors };
  }
  console.error('Donation intent failed', httpStatus, body);
  return { status: 'failed', errors: errors.length ? errors : [{ code: String(httpStatus), message: 'The donation could not be started.' }] };
}
