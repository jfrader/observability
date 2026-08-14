/**
 * PostHog (browser) strategy. Requires the optional peer `posthog-js`.
 *
 * Defaults: pageviews captured, autocapture off, session recording off —
 * keep the free tier and privacy simple. Apps can opt in per-feature.
 */
import type { AnalyticsProvider } from "../types.js";
export interface PosthogBrowserConfig {
    key: string;
    /** e.g. `https://us.i.posthog.com` */
    host: string;
    options?: {
        /** Default true. */
        capture_pageview?: boolean;
        /** Default false. */
        autocapture?: boolean;
        /** Default true. */
        disable_session_recording?: boolean;
        /** Any other `posthog.init` option. */
        [key: string]: unknown;
    };
}
export declare function createPosthogBrowserAnalytics(config: PosthogBrowserConfig): AnalyticsProvider;
