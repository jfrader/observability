/**
 * Node entry: facade + request-error helper. Framework-agnostic; Fastify
 * users call `captureRequestError` from `setErrorHandler`.
 */

export { createObservability, createNoopAnalytics, createNoopErrorReporter } from "../core.js";
export type { Observability, ObservabilityConfig } from "../types.js";
import { createObservability } from "../core.js";
import type { Observability } from "../types.js";
/** Alias for `createObservability` that reads clearly in server code. */
export const createNodeObservability = createObservability;
export { readNodeEnv } from "../env.js";

export interface RequestLike {
  id?: string;
  method?: string;
  url?: string;
  statusCode?: number;
}

/**
 * Report a request-scoped error with consistent context (request id, method,
 * url). Use from framework error handlers:
 *
 * ```ts
 * app.setErrorHandler((error, request, reply) => {
 *   captureRequestError(observability, request, error);
 *   reply.send(error);
 * });
 * ```
 */
export function captureRequestError(
  observability: Observability,
  request: RequestLike,
  error: unknown,
): void {
  observability.captureException(error, {
    tags: {
      method: request.method ?? "unknown",
      url: request.url ?? "unknown",
    },
    extra: {
      reqId: request.id,
      statusCode: request.statusCode,
    },
  });
}
