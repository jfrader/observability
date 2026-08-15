/**
 * Node entry: facade + request-error helper. Framework-agnostic; Fastify
 * users call `captureRequestError` from `setErrorHandler`.
 */
export { createObservability, createNoopAnalytics, createNoopErrorReporter } from "../core.js";
import { createObservability } from "../core.js";
/** Alias for `createObservability` that reads clearly in server code. */
export const createNodeObservability = createObservability;
export { readNodeEnv } from "../env.js";
function requestPath(url) {
    if (!url)
        return "unknown";
    try {
        return new URL(url, "https://observability.invalid").pathname || "/";
    }
    catch {
        return url.split(/[?#]/u, 1)[0] || "unknown";
    }
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
export function captureRequestError(observability, request, error) {
    observability.captureException(error, {
        tags: {
            method: request.method ?? "unknown",
            path: requestPath(request.url),
        },
        extra: {
            reqId: request.id,
            statusCode: request.statusCode,
        },
    });
}
//# sourceMappingURL=index.js.map