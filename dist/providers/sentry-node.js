/**
 * Sentry (node) strategy. Requires the optional peer `@sentry/node`.
 * Errors-only by default (`tracesSampleRate: 0`), URLs scrubbed of
 * credentials/tokens by default.
 */
import { addBreadcrumb, captureException as sentryCaptureException, captureMessage as sentryCaptureMessage, flush as sentryFlush, init, setContext, setTag, setUser, } from "@sentry/node";
import { redactBreadcrumbUrls, redactSensitiveUrl, } from "../redact.js";
function toSentryContext(context) {
    if (!context)
        return undefined;
    const result = {};
    if (context.extra !== undefined)
        result.extra = context.extra;
    if (context.tags !== undefined)
        result.tags = context.tags;
    if (context.user !== undefined)
        result.user = context.user;
    if (context.fingerprint !== undefined)
        result.fingerprint = context.fingerprint;
    return result;
}
export function createSentryNodeErrorReporter(config) {
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
        captureException(error, context) {
            sentryCaptureException(error, toSentryContext(context));
        },
        captureMessage(message, level = "info", context) {
            sentryCaptureMessage(message, {
                ...toSentryContext(context),
                level,
            });
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
//# sourceMappingURL=sentry-node.js.map