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
/**
 * Read provider config from a build-time env object (e.g. `import.meta.env`
 * in Vite). Convention (prefix defaults to `VITE_`):
 *
 * - `${prefix}SENTRY_DSN` → sentryDsn
 * - `${prefix}PUBLIC_POSTHOG_KEY` | `${prefix}POSTHOG_KEY` → posthogKey
 * - `${prefix}PUBLIC_POSTHOG_HOST` | `${prefix}POSTHOG_HOST` → posthogHost
 * - `${prefix}ANALYTICS_URL` → analyticsUrl (custom beacon endpoint)
 */
export declare function readBrowserEnv(env: Record<string, string | undefined>, prefix?: string): ProviderEnv;
/** Same conventions from `process.env` (server side). */
export declare function readNodeEnv(env?: NodeJS.ProcessEnv): ProviderEnv;
