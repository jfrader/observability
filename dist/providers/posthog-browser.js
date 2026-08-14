/**
 * PostHog (browser) strategy. Requires the optional peer `posthog-js`.
 *
 * Defaults: pageviews captured, autocapture off, session recording off —
 * keep the free tier and privacy simple. Apps can opt in per-feature.
 */
import { posthog } from "posthog-js";
let initialized = false;
export function createPosthogBrowserAnalytics(config) {
    if (!initialized) {
        initialized = true;
        posthog.init(config.key, {
            api_host: config.host,
            capture_pageview: config.options?.capture_pageview ?? true,
            autocapture: config.options?.autocapture ?? false,
            disable_session_recording: config.options?.disable_session_recording ?? true,
            ...config.options,
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