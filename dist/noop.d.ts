import type { AnalyticsProvider, ErrorReporter } from "./types.js";
/**
 * Null-object strategies. Used as fallbacks when an app has no provider
 * configured: everything is a no-op, nothing throws, nothing is sent.
 */
export declare function createNoopErrorReporter(log?: boolean): ErrorReporter;
export declare function createNoopAnalytics(log?: boolean): AnalyticsProvider;
