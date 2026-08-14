/**
 * PostHog (node) strategy. Requires the optional peer `posthog-node`.
 * Events are sent with a single distinct id (set via `identify`, or the
 * `defaultDistinctId` option); call `flush()` before the process exits.
 */
import { PostHog } from "posthog-node";
export function createPosthogNodeAnalytics(config) {
    const client = new PostHog(config.key, {
        host: config.host,
        ...config.options,
    });
    let distinctId = config.defaultDistinctId ?? "server";
    return {
        track(event, properties) {
            client.capture({ distinctId, event, properties });
        },
        identify(userId, traits) {
            distinctId = userId;
            client.identify({ distinctId: userId, properties: traits });
        },
        reset() {
            distinctId = config.defaultDistinctId ?? "server";
        },
        async flush() {
            await client.flush();
        },
    };
}
//# sourceMappingURL=posthog-node.js.map