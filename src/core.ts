import { createNoopAnalytics, createNoopErrorReporter } from "./noop.js";
import type { Observability, ObservabilityConfig } from "./types.js";

/**
 * Build the unified {@link Observability} facade from (optional) provider
 * strategies. Anything not configured falls back to a silent noop, so apps
 * without a DSN/key behave exactly like apps with one.
 */
export function createObservability(config: ObservabilityConfig): Observability {
  const error = config.errorReporter ?? createNoopErrorReporter();
  const analytics = config.analytics ?? createNoopAnalytics();

  return {
    appName: config.appName,
    environment: config.environment,
    error,
    analytics,

    track(event, properties) {
      analytics.track(event, properties);
    },
    captureException(errorToReport, context) {
      error.captureException(errorToReport, context);
    },
    captureMessage(message, level = "info", context) {
      error.captureMessage(message, level, context);
    },
    setUser(user) {
      error.setUser(user);
    },
    identify(userId, traits) {
      analytics.identify(userId, traits);
    },
    page(name, properties) {
      if (analytics.page) {
        analytics.page(name, properties);
      } else {
        analytics.track("page", { name, ...properties });
      }
    },
    setTag(key, value) {
      error.setTag(key, value);
    },
    setContext(name, data) {
      error.setContext(name, data);
    },
    addBreadcrumb(breadcrumb) {
      error.addBreadcrumb?.(breadcrumb);
    },
    async flush() {
      await Promise.all([error.flush?.(5000), analytics.flush?.()]);
    },
  };
}

export * from "./types.js";
export { createNoopAnalytics, createNoopErrorReporter } from "./noop.js";
export * from "./redact.js";
export { readBrowserEnv, readNodeEnv } from "./env.js";
