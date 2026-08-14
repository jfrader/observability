/**
 * Sentry (browser) strategy. Requires the optional peer `@sentry/react`.
 *
 * Defaults are privacy-first and errors-only:
 * - `tracesSampleRate: 0` (tune up when you actually want tracing)
 * - `sendDefaultPii: false`
 * - URLs and breadcrumbs are scrubbed of credentials/tokens by default.
 */
import { type Breadcrumb, type ErrorEvent, type EventHint } from "@sentry/react";
import { type RedactUrlOptions } from "../redact.js";
import type { ErrorReporter } from "../types.js";
export interface SentryBrowserConfig {
    dsn: string;
    environment?: string;
    release?: string;
    /** Defaults to 0 — errors only. Set a sample rate to enable tracing. */
    tracesSampleRate?: number;
    /** Scrub credentials/tokens from request URLs + breadcrumb URLs. Default true. */
    redact?: boolean | RedactUrlOptions;
    /** App-specific event hook, applied after built-in redaction. */
    beforeSend?: (event: ErrorEvent, hint?: EventHint) => ErrorEvent | null;
    /** App-specific breadcrumb hook, applied after built-in redaction. */
    beforeBreadcrumb?: (breadcrumb: Breadcrumb, hint?: EventHint) => Breadcrumb | null;
    /** Extra options merged into `Sentry.init`. */
    initOptions?: Record<string, unknown>;
}
export declare function createSentryBrowserErrorReporter(config: SentryBrowserConfig): ErrorReporter;
export type SentryBrowserErrorReporter = ReturnType<typeof createSentryBrowserErrorReporter>;
