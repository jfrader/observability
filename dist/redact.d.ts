/**
 * Redaction utilities for events that may leave the browser/server.
 *
 * These are the primitives used by the Sentry adapters' default `beforeSend`
 * hooks, and are exported for apps that want to scrub custom shapes too
 * (e.g. breadcrumb data, custom event payloads).
 */
/** Query parameters that typically carry credentials or one-time tokens. */
export declare const SENSITIVE_QUERY_KEYS: Set<string>;
export interface RedactUrlOptions {
    /** Query keys to scrub; defaults to {@link SENSITIVE_QUERY_KEYS}. */
    queryKeys?: ReadonlySet<string>;
    /** Regex to scrub long tokens embedded in the value (applied to the whole string). */
    tokenRegex?: RegExp;
}
/**
 * Redact credentials and long opaque tokens from a URL string, preserving the
 * rest. Handles absolute and relative URLs, query strings and hash fragments.
 *
 * ```ts
 * redactSensitiveUrl("https://x.com/teams/join/abc...43chars?token=t#state=s")
 * // "https://x.com/teams/join/[redacted]?token=[Filtered]#filtered"
 * ```
 */
export declare function redactSensitiveUrl(value: string, options?: RedactUrlOptions): string;
/**
 * Scrub long opaque tokens (43+ char alphanumeric/`-_` runs) from a string.
 * Pass an app-specific regex to also catch shaped tokens (e.g. `teams/join/...`).
 */
export declare function redactLongTokens(value: string, tokenRegex?: RegExp): string;
/**
 * Convenience for scrubbing the `url`/`from`/`to` fields of breadcrumb-like
 * objects in place. Mutates and returns the object.
 */
export declare function redactBreadcrumbUrls<T extends {
    data?: Record<string, unknown>;
}>(breadcrumb: T, options?: RedactUrlOptions): T;
