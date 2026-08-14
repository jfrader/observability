/**
 * Sentry (node) strategy. Requires the optional peer `@sentry/node`.
 * Errors-only by default (`tracesSampleRate: 0`), URLs scrubbed of
 * credentials/tokens by default.
 */

import {
  addBreadcrumb,
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  flush as sentryFlush,
  init,
  setContext,
  setTag,
  setUser,
  type Breadcrumb,
  type ErrorEvent,
  type EventHint,
} from "@sentry/node";

import {
  redactBreadcrumbUrls,
  redactSensitiveUrl,
  type RedactUrlOptions,
} from "../redact.js";
import type { CaptureContext, ErrorReporter } from "../types.js";

function toSentryContext(context?: CaptureContext): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const result: Record<string, unknown> = {};
  if (context.extra !== undefined) result.extra = context.extra;
  if (context.tags !== undefined) result.tags = context.tags;
  if (context.user !== undefined) result.user = context.user;
  if (context.fingerprint !== undefined) result.fingerprint = context.fingerprint;
  return result;
}

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

export function createSentryNodeErrorReporter(config: SentryNodeConfig): ErrorReporter {
  const redactOptions = config.redact === false ? undefined : config.redact === true ? {} : config.redact;
  const redactUrls = config.redact !== false;

  init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate ?? 0,
    beforeSend(event, hint) {
      let next = event;
      if (redactUrls) {
        if (typeof next.request?.url === "string") {
          next.request.url = redactSensitiveUrl(next.request.url, redactOptions);
        }
        if (next.request?.query_string !== undefined) {
          delete next.request.query_string;
        }
        for (const breadcrumb of next.breadcrumbs ?? []) {
          redactBreadcrumbUrls(breadcrumb, redactOptions);
        }
      }
      return config.beforeSend ? config.beforeSend(next, hint) : next;
    },
    ...config.initOptions,
  });

  return {
    captureException(error: unknown, context) {
      sentryCaptureException(error, toSentryContext(context) as Parameters<typeof sentryCaptureException>[1]);
    },
    captureMessage(message, level = "info", context) {
      sentryCaptureMessage(message, {
        ...toSentryContext(context),
        level,
      } as Parameters<typeof sentryCaptureMessage>[1]);
    },
    setUser(user) {
      setUser(user ?? null);
    },
    setTag(key, value) {
      setTag(key, value);
    },
    setContext(name, data) {
      setContext(name, data);
    },
    addBreadcrumb(breadcrumb) {
      addBreadcrumb({
        message: breadcrumb.message,
        level: breadcrumb.level,
        category: breadcrumb.category,
        data: breadcrumb.data,
        timestamp: breadcrumb.timestamp,
      });
    },
    async flush(timeoutMs = 5000) {
      return sentryFlush(timeoutMs);
    },
  };
}

export type SentryNodeErrorReporter = ReturnType<typeof createSentryNodeErrorReporter>;
