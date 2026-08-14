/**
 * PostHog (node) strategy. Requires the optional peer `posthog-node`.
 * Events are sent with a single distinct id (set via `identify`, or the
 * `defaultDistinctId` option); call `flush()` before the process exits.
 */
import type { AnalyticsProvider } from "../types.js";
export interface PosthogNodeConfig {
    key: string;
    /** e.g. `https://us.i.posthog.com` */
    host?: string;
    /** Distinct id used until `identify` is called. Defaults to "server". */
    defaultDistinctId?: string;
    /** Any other `PostHog` constructor option. */
    options?: Record<string, unknown>;
}
export declare function createPosthogNodeAnalytics(config: PosthogNodeConfig): AnalyticsProvider;
