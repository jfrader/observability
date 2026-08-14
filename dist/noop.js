/**
 * Null-object strategies. Used as fallbacks when an app has no provider
 * configured: everything is a no-op, nothing throws, nothing is sent.
 */
export function createNoopErrorReporter(log = false) {
    const debug = log
        ? (...args) => console.debug("[observability:noop]", ...args)
        : () => undefined;
    return {
        captureException(error, context) {
            debug("captureException", { error, context });
        },
        captureMessage(message, level = "info", context) {
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
export function createNoopAnalytics(log = false) {
    const debug = log
        ? (...args) => console.debug("[observability:noop]", ...args)
        : () => undefined;
    return {
        track(event, properties) {
            debug("track", { event, properties });
        },
        identify(userId, traits) {
            debug("identify", { userId, traits });
        },
        reset() {
            debug("reset");
        },
        page(name, properties) {
            debug("page", { name, properties });
        },
        async flush() { },
    };
}
//# sourceMappingURL=noop.js.map