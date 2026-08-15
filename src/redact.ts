/**
 * Redaction utilities for events that may leave the browser/server.
 *
 * These are the primitives used by the Sentry adapters' default `beforeSend`
 * hooks, and are exported for apps that want to scrub custom shapes too
 * (e.g. breadcrumb data, custom event payloads).
 */

/** Query parameters that typically carry credentials or one-time tokens. */
export const SENSITIVE_QUERY_KEYS = new Set([
  "access_token",
  "api_key",
  "apikey",
  "code",
  "id_token",
  "identity",
  "jwt",
  "password",
  "refresh_token",
  "secret",
  "state",
  "token",
]);

/** Hash fragments that usually embed OAuth flows or magic links. */
const SENSITIVE_HASH_PATTERN = /(?:token|code|state|identity)/i;

const SENSITIVE_QUERY_VALUE_PATTERN =
  /([?&](?:access_token|api_key|apikey|code|id_token|identity|jwt|password|refresh_token|secret|state|token)\s*=)[^&#\s]*/gi;

/** Long opaque tokens (e.g. team join links, bearer-ish strings). */
const STANDALONE_LONG_TOKEN =
  /(^|[^A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?=$|[^A-Za-z0-9_-])/g;

export interface RedactUrlOptions {
  /** Query keys to scrub; defaults to {@link SENSITIVE_QUERY_KEYS}. */
  queryKeys?: ReadonlySet<string>;
  /** App-specific query keys to scrub in addition to the defaults. */
  additionalQueryKeys?: ReadonlySet<string>;
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
export function redactSensitiveUrl(value: string, options?: RedactUrlOptions): string {
  const queryKeys = options?.queryKeys ?? SENSITIVE_QUERY_KEYS;
  const additionalQueryKeys = options?.additionalQueryKeys;
  let scrubbed = redactLongTokens(value, options?.tokenRegex);

  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(scrubbed);
    const parsed = new URL(scrubbed, "https://redaction.invalid");
    for (const key of Array.from(parsed.searchParams.keys())) {
      const normalizedKey = key.toLowerCase();
      if (queryKeys.has(normalizedKey) || additionalQueryKeys?.has(normalizedKey)) {
        parsed.searchParams.set(key, "[Filtered]");
      }
    }
    if (parsed.hash && SENSITIVE_HASH_PATTERN.test(parsed.hash)) {
      parsed.hash = "#filtered";
    }
    return absolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return scrubbed.replace(SENSITIVE_QUERY_VALUE_PATTERN, "$1[Filtered]");
  }
}

/**
 * Scrub long opaque tokens (43+ char alphanumeric/`-_` runs) from a string.
 * Pass an app-specific regex to also catch shaped tokens (e.g. `teams/join/...`).
 */
export function redactLongTokens(value: string, tokenRegex: RegExp = STANDALONE_LONG_TOKEN): string {
  return value.replace(tokenRegex, "$1[redacted]");
}

/**
 * Convenience for scrubbing the `url`/`from`/`to` fields of breadcrumb-like
 * objects in place. Mutates and returns the object.
 */
export function redactBreadcrumbUrls<T extends { data?: Record<string, unknown> }>(
  breadcrumb: T,
  options?: RedactUrlOptions,
): T {
  for (const key of ["url", "from", "to"]) {
    const value = breadcrumb.data?.[key];
    if (typeof value === "string") {
      breadcrumb.data![key] = redactSensitiveUrl(value, options);
    }
  }
  return breadcrumb;
}
