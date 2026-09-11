interface SfdcEnv {
  basePath?: string;
  apiPath?: string;
}

function readEnv(): SfdcEnv | undefined {
  const env = (globalThis as { SFDC_ENV?: SfdcEnv }).SFDC_ENV;
  return env && typeof env === 'object' ? env : undefined;
}

/** Router basename derived from the platform-injected base path (no trailing slash). */
export function getBasename(): string | undefined {
  const raw = readEnv()?.basePath;
  if (typeof raw !== 'string' || raw === '') return undefined;
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * Absolute URL for an in-app route, preserving the Experience site path prefix.
 * Used for the FinDock SuccessURL / FailureURL so the PSP returns the donor to this site,
 * not to the bare origin (which would drop the site prefix and land off-site).
 */
export function appUrl(routePath: string): string {
  const base = getBasename() ?? '';
  const path = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${window.location.origin}${base === '/' ? '' : base}${path}`;
}
