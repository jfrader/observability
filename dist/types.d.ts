/**
 * Strategy interfaces for error tracking and analytics.
 *
 * Every provider in this package implements these two interfaces, so an app
 * can switch providers (or drop to a noop) without touching call sites.
 * See `createObservability` for the facade that combines them.
 */
export type MessageLevel = "debug" | "info" | "warning" | "error" | "fatal";
export interface CaptureContext {
    /** Arbitrary structured data attached to the event. */
    extra?: Record<string, unknown>;
    /** Indexable key/value metadata (must be strings in most backends). */
    tags?: Record<string, string>;
    /** User attached to the event (only explicit user info, never PII by default). */
    user?: {
        id?: string;
        email?: string;
        username?: string;
    };
    /** Groups an event together with others sharing the same fingerprint. */
    fingerprint?: string[];
}
export interface ErrorReporter {
    captureException(error: unknown, context?: CaptureContext): void;
    captureMessage(message: string, level?: MessageLevel, context?: CaptureContext): void;
    setUser(user: {
        id?: string;
        email?: string;
        username?: string;
    } | null): void;
    setTag(key: string, value: string): void;
    setContext(name: string, data: Record<string, unknown>): void;
    addBreadcrumb?(breadcrumb: {
        message: string;
        level?: MessageLevel;
        category?: string;
        data?: Record<string, unknown>;
        timestamp?: number;
    }): void;
    /** Best-effort delivery of queued events. Resolves when delivered or timed out. */
    flush?(timeoutMs?: number): Promise<boolean>;
}
export interface AnalyticsProvider {
    track(event: string, properties?: Record<string, unknown>): void;
    identify(userId: string, traits?: Record<string, unknown>): void;
    /** Forget the current user (logout). */
    reset?(): void;
    /** Page view. Adapters may fall back to tracking a "page" event. */
    page?(name?: string, properties?: Record<string, unknown>): void;
    /** Best-effort delivery of queued events. */
    flush?(): Promise<void>;
}
export interface ObservabilityConfig {
    /** Short kebab-case app name, used as release prefix and event tag. */
    appName: string;
    /** production | testnet | development | ... — used for Sentry environments. */
    environment: string;
    /** Error reporter strategy. Falls back to a noop when omitted. */
    errorReporter?: ErrorReporter;
    /** Analytics strategy. Falls back to a noop when omitted. */
    analytics?: AnalyticsProvider;
}
/** Unified facade over one error reporter + one analytics provider. */
export interface Observability {
    readonly appName: string;
    readonly environment: string;
    readonly error: ErrorReporter;
    readonly analytics: AnalyticsProvider;
    track(event: string, properties?: Record<string, unknown>): void;
    captureException(error: unknown, context?: CaptureContext): void;
    captureMessage(message: string, level?: MessageLevel, context?: CaptureContext): void;
    setUser(user: {
        id?: string;
        email?: string;
        username?: string;
    } | null): void;
    identify(userId: string, traits?: Record<string, unknown>): void;
    page(name?: string, properties?: Record<string, unknown>): void;
    setTag(key: string, value: string): void;
    setContext(name: string, data: Record<string, unknown>): void;
    addBreadcrumb(breadcrumb: {
        message: string;
        level?: MessageLevel;
        category?: string;
        data?: Record<string, unknown>;
        timestamp?: number;
    }): void;
    /** Flush both providers (noop-safe). */
    flush(): Promise<void>;
}
