/**
 * Convention-based env readers.
 *
 * Providers never read env themselves: apps build the config and pass it in.
 * These helpers just encode the common conventions so apps stay consistent.
 */

export interface ProviderEnv {
  sentryDsn?: string;
  posthogKey?: string;
  posthogHost?: string;
  /** Custom beacon endpoint (see `createBeaconAnalytics`). */
  analyticsUrl?: string;
}

const firstDefined = (env: Record<string, string | undefined>, keys: string[]) => {
  for (const key of keys) {
    const value = env[key];
    if (value) return value;
  }
  return undefined;
};

/**
 * Read provider config from a build-time env object (e.g. `import.meta.env`
 * in Vite). Convention (prefix defaults to `VITE_`):
 *
 * - `${prefix}SENTRY_DSN` → sentryDsn
 * - `${prefix}PUBLIC_POSTHOG_KEY` | `${prefix}POSTHOG_KEY` → posthogKey
 * - `${prefix}PUBLIC_POSTHOG_HOST` | `${prefix}POSTHOG_HOST` → posthogHost
 * - `${prefix}ANALYTICS_URL` → analyticsUrl (custom beacon endpoint)
 */
export function readBrowserEnv(
  env: Record<string, string | undefined>,
  prefix = "VITE_",
): ProviderEnv {
  return {
    sentryDsn: firstDefined(env, [`${prefix}SENTRY_DSN`]),
    posthogKey: firstDefined(env, [`${prefix}PUBLIC_POSTHOG_KEY`, `${prefix}POSTHOG_KEY`]),
    posthogHost: firstDefined(env, [`${prefix}PUBLIC_POSTHOG_HOST`, `${prefix}POSTHOG_HOST`]),
    analyticsUrl: firstDefined(env, [`${prefix}ANALYTICS_URL`]),
  };
}

/** Same conventions from `process.env` (server side). */
export function readNodeEnv(env: NodeJS.ProcessEnv = process.env): ProviderEnv {
  return {
    sentryDsn: firstDefined(env, ["SENTRY_DSN"]),
    posthogKey: firstDefined(env, ["PUBLIC_POSTHOG_KEY", "POSTHOG_KEY"]),
    posthogHost: firstDefined(env, ["PUBLIC_POSTHOG_HOST", "POSTHOG_HOST"]),
    analyticsUrl: firstDefined(env, ["ANALYTICS_URL"]),
  };
}
