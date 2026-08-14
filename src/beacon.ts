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
  buildPayload?: (
    event: string,
    properties?: Record<string, unknown>,
  ) => Record<string, unknown>;
}

/**
 * Zero-dependency analytics for self-hosted or custom endpoints. Compatible
 * with huertoku's original beacon schema (`{ name, data, url, ts }`), which
 * works with Plausible, Umami or a tiny own endpoint.
 *
 * Never throws: if sending is impossible, the event is dropped.
 */
export function createBeaconAnalytics(config: BeaconAnalyticsConfig): AnalyticsProvider {
  const currentUrl = () => {
    if (typeof window === "undefined") return "";
    const url = window.location.href;
    return config.redactUrl ? config.redactUrl(url) : url;
  };

  const buildPayload = (
    event: string,
    properties?: Record<string, unknown>,
  ): Record<string, unknown> => {
    if (config.buildPayload) {
      return config.buildPayload(event, properties);
    }
    return {
      name: event,
      data: properties ?? {},
      url: currentUrl(),
      ts: Date.now(),
    };
  };

  const send = (body: Record<string, unknown>) => {
    try {
      const payload = JSON.stringify(body);
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(config.endpoint, new Blob([payload], { type: "application/json" }));
        return;
      }
      if (typeof fetch !== "undefined") {
        void fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      // Analytics never breaks the app.
    }
  };

  return {
    track(event, properties) {
      send(buildPayload(event, properties));
    },
    page(name, properties) {
      send(buildPayload("page", { name, ...properties }));
    },
    identify() {
      // The custom endpoint schema has no user identity concept.
    },
    async flush() {},
  };
}
