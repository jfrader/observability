import type { Observability, ObservabilityConfig } from "./types.js";
/**
 * Build the unified {@link Observability} facade from (optional) provider
 * strategies. Anything not configured falls back to a silent noop, so apps
 * without a DSN/key behave exactly like apps with one.
 */
export declare function createObservability(config: ObservabilityConfig): Observability;
export * from "./types.js";
export { createNoopAnalytics, createNoopErrorReporter } from "./noop.js";
export * from "./redact.js";
export { readBrowserEnv, readNodeEnv } from "./env.js";
