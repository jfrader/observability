/**
 * Convention-based env readers.
 *
 * Providers never read env themselves: apps build the config and pass it in.
 * These helpers just encode the common conventions so apps stay consistent.
 */
const firstDefined = (env, keys) => {
    for (const key of keys) {
        const value = env[key];
        if (value)
            return value;
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
export function readBrowserEnv(env, prefix = "VITE_") {
    return {
        sentryDsn: firstDefined(env, [`${prefix}SENTRY_DSN`]),
        posthogKey: firstDefined(env, [`${prefix}PUBLIC_POSTHOG_KEY`, `${prefix}POSTHOG_KEY`]),
        posthogHost: firstDefined(env, [`${prefix}PUBLIC_POSTHOG_HOST`, `${prefix}POSTHOG_HOST`]),
        analyticsUrl: firstDefined(env, [`${prefix}ANALYTICS_URL`]),
    };
}
/** Same conventions from `process.env` (server side). */
export function readNodeEnv(env = process.env) {
    return {
        sentryDsn: firstDefined(env, ["SENTRY_DSN"]),
        posthogKey: firstDefined(env, ["PUBLIC_POSTHOG_KEY", "POSTHOG_KEY"]),
        posthogHost: firstDefined(env, ["PUBLIC_POSTHOG_HOST", "POSTHOG_HOST"]),
        analyticsUrl: firstDefined(env, ["ANALYTICS_URL"]),
    };
}
//# sourceMappingURL=env.js.map