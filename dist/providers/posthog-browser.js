/**
 * PostHog (browser) strategy. Requires the optional peer `posthog-js`.
 *
 * Defaults: SPA pageviews captured, autocapture off, session recording off —
 * keep the free tier and privacy simple. Apps can opt in per-feature.
 */
import { posthog } from "posthog-js";
import { redactSensitiveUrl } from "../redact.js";
const URL_PROPERTIES = ["$current_url", "$referrer", "url", "referrer", "from", "to"];
function redactEventUrls(event, options) {
    if (!event?.properties)
        return event;
    for (const key of URL_PROPERTIES) {
        const value = event.properties[key];
        if (typeof value === "string") {
            event.properties[key] = redactSensitiveUrl(value, options);
        }
    }
    return event;
}
let initialized = false;
export function createPosthogBrowserAnalytics(config) {
    if (!initialized) {
        initialized = true;
        const options = config.options ?? {};
        const configuredBeforeSend = options.before_send;
        const redactOptions = config.redact === true ? {} : config.redact || undefined;
        const beforeSend = config.redact === false
            ? configuredBeforeSend
            : [
                (event) => redactEventUrls(event, redactOptions),
                ...(Array.isArray(configuredBeforeSend)
                    ? configuredBeforeSend
                    : configuredBeforeSend
                        ? [configuredBeforeSend]
                        : []),
            ];
        posthog.init(config.key, {
            api_host: config.host,
            capture_pageview: options.capture_pageview ?? "history_change",
            autocapture: options.autocapture ?? false,
            disable_session_recording: options.disable_session_recording ?? true,
            ...options,
            ...(beforeSend ? { before_send: beforeSend } : {}),
        });
    }
    return {
        track(event, properties) {
            posthog.capture(event, properties);
        },
        identify(userId, traits) {
            posthog.identify(userId, traits);
        },
        reset() {
            posthog.reset();
        },
        page(name, properties) {
            posthog.capture("$pageview", { name, ...properties });
        },
        async flush() {
            // posthog-js queues internally and flushes on its own interval,
            // using sendBeacon on page unload — nothing to do here.
        },
    };
}
//# sourceMappingURL=posthog-browser.js.map