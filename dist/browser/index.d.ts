/**
 * Browser entry: facade + React glue. Everything in here is tree-shakeable
 * and pulls zero runtime dependencies from this package itself; provider SDKs
 * (Sentry/PostHog) are only loaded when you import their adapter subpath.
 */
export { createObservability } from "../core.js";
export type { Observability, ObservabilityConfig } from "../types.js";
import { createObservability } from "../core.js";
/** Alias for `createObservability` that reads clearly in browser code. */
export declare const createBrowserObservability: typeof createObservability;
export { createNoopAnalytics, createNoopErrorReporter } from "../noop.js";
export { createBeaconAnalytics } from "../beacon.js";
export * from "../redact.js";
export { readBrowserEnv } from "../env.js";
export { ObservabilityProvider, ObservabilityErrorBoundary, type ObservabilityErrorBoundaryProps, useObservability, useTrack, } from "./react.js";
