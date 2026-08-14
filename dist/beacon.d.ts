import type { AnalyticsProvider } from "./types.js";
export interface BeaconAnalyticsConfig {
    /** Endpoint that accepts POST JSON (e.g. `/api/v1/events` or a Plausible/Umami-compatible proxy). */
    endpoint: string;
    /**
     * Scrub the URL before including it in payloads. Use this to strip
     * share codes or other receiver-visible data (e.g. huertoku strips `?g=`).
     */
    redactUrl?: (url: string) => string;
    /** Override the payload shape entirely. */
    buildPayload?: (event: string, properties?: Record<string, unknown>) => Record<string, unknown>;
}
/**
 * Zero-dependency analytics for self-hosted or custom endpoints. Compatible
 * with huertoku's original beacon schema (`{ name, data, url, ts }`), which
 * works with Plausible, Umami or a tiny own endpoint.
 *
 * Never throws: if sending is impossible, the event is dropped.
 */
export declare function createBeaconAnalytics(config: BeaconAnalyticsConfig): AnalyticsProvider;
