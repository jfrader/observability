/**
 * Core (isomorphic) entry: facade, strategy interfaces, noop + beacon
 * analytics, redaction utilities and env readers. Browser/React and Node
 * conveniences live under `@jfrader/observability/browser` and `/node`;
 * provider adapters under `/providers/*`.
 */

export * from "./core.js";
