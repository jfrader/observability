import type {
  AnalyticsProvider,
  CaptureContext,
  ErrorReporter,
  MessageLevel,
} from "./types.js";

/**
 * Null-object strategies. Used as fallbacks when an app has no provider
 * configured: everything is a no-op, nothing throws, nothing is sent.
 */

export function createNoopErrorReporter(log = false): ErrorReporter {
  const debug = log
    ? (...args: unknown[]) => console.debug("[observability:noop]", ...args)
    : () => undefined;

  return {
    captureException(error: unknown, context?: CaptureContext) {
      debug("captureException", { error, context });
    },
    captureMessage(message: string, level: MessageLevel = "info", context?: CaptureContext) {
      debug("captureMessage", { message, level, context });
    },
    setUser() {
      debug("setUser");
    },
    setTag() {
      debug("setTag");
    },
    setContext() {
      debug("setContext");
    },
    addBreadcrumb(breadcrumb) {
      debug("addBreadcrumb", breadcrumb);
    },
    async flush() {
      return true;
    },
  };
}

export function createNoopAnalytics(log = false): AnalyticsProvider {
  const debug = log
    ? (...args: unknown[]) => console.debug("[observability:noop]", ...args)
    : () => undefined;

  return {
    track(event: string, properties?: Record<string, unknown>) {
      debug("track", { event, properties });
    },
    identify(userId: string, traits?: Record<string, unknown>) {
      debug("identify", { userId, traits });
    },
    reset() {
      debug("reset");
    },
    page(name?: string, properties?: Record<string, unknown>) {
      debug("page", { name, properties });
    },
    async flush() {},
  };
}
