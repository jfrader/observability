/**
 * Sentry (node) strategy. Requires the optional peer `@sentry/node`.
 * Errors-only by default (`tracesSampleRate: 0`), URLs scrubbed of
 * credentials/tokens by default.
 */
import { type ErrorEvent, type EventHint } from "@sentry/node";
import { type RedactUrlOptions } from "../redact.js";
import type { ErrorReporter } from "../types.js";
export interface SentryNodeConfig {
    dsn: string;
    environment?: string;
    release?: string;
    /** Defaults to 0 — errors only. Set a sample rate to enable tracing. */
    tracesSampleRate?: number;
    /** Scrub credentials/tokens from request URLs + breadcrumb URLs. Default true. */
    redact?: boolean | RedactUrlOptions;
    /** App-specific event hook, applied after built-in redaction. */
    beforeSend?: (event: ErrorEvent, hint?: EventHint) => ErrorEvent | null;
    /** Extra options merged into `Sentry.init`. */
    initOptions?: Record<string, unknown>;
}
export declare function createSentryNodeErrorReporter(config: SentryNodeConfig): ErrorReporter;
export type SentryNodeErrorReporter = ReturnType<typeof createSentryNodeErrorReporter>;
