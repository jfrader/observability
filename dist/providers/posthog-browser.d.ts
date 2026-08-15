/**
 * PostHog (browser) strategy. Requires the optional peer `posthog-js`.
 *
 * Defaults: SPA pageviews captured, autocapture off, session recording off —
 * keep the free tier and privacy simple. Apps can opt in per-feature.
 */
import { type RedactUrlOptions } from "../redact.js";
import type { AnalyticsProvider } from "../types.js";
export interface PosthogBrowserConfig {
    key: string;
    /** e.g. `https://us.i.posthog.com` */
    host: string;
    /** Scrub credentials/tokens from URL-like event properties. Default true. */
    redact?: boolean | RedactUrlOptions;
    options?: {
        /** Default `history_change` for initial + SPA route pageviews. */
        capture_pageview?: boolean | "history_change";
        /** Default false. */
        autocapture?: boolean;
        /** Default true. */
        disable_session_recording?: boolean;
        /** Any other `posthog.init` option. */
        [key: string]: unknown;
    };
}
export declare function createPosthogBrowserAnalytics(config: PosthogBrowserConfig): AnalyticsProvider;
