/**
 * PostHog (browser) strategy. Requires the optional peer `posthog-js`.
 *
 * Defaults: SPA pageviews captured, autocapture off, session recording off —
 * keep the free tier and privacy simple. Apps can opt in per-feature.
 */

import { posthog, type BeforeSendFn, type CaptureResult } from "posthog-js";
import { redactSensitiveUrl, type RedactUrlOptions } from "../redact.js";
import type { AnalyticsProvider } from "../types.js";

const URL_PROPERTIES = ["$current_url", "$referrer", "url", "referrer", "from", "to"] as const;

function redactEventUrls(event: CaptureResult | null, options?: RedactUrlOptions): CaptureResult | null {
  if (!event?.properties) return event;
  for (const key of URL_PROPERTIES) {
    const value = event.properties[key];
    if (typeof value === "string") {
      event.properties[key] = redactSensitiveUrl(value, options);
    }
  }
  return event;
}

export interface PosthogBrowserConfig {
  key: string;
  /** e.g. `https://us.i.posthog.com` */
  host: string;
  /** Scrub credentials/tokens from URL-like event properties. Default true. */
  redact?: boolean | RedactUrlOptions;
  options?: {
    /** Default `history_change` for initial + SPA route pageviews. */
    capture_pageview?: boolean | "history_change";
    /** Default false. */
    autocapture?: boolean;
    /** Default true. */
    disable_session_recording?: boolean;
    /** Any other `posthog.init` option. */
    [key: string]: unknown;
  };
}

let initialized = false;

export function createPosthogBrowserAnalytics(config: PosthogBrowserConfig): AnalyticsProvider {
  if (!initialized) {
    initialized = true;
    const options = config.options ?? {};
    const configuredBeforeSend = options.before_send as BeforeSendFn | BeforeSendFn[] | undefined;
    const redactOptions = config.redact === true ? {} : config.redact || undefined;
    const beforeSend =
      config.redact === false
        ? configuredBeforeSend
        : [
            (event: CaptureResult | null) => redactEventUrls(event, redactOptions),
            ...(Array.isArray(configuredBeforeSend)
              ? configuredBeforeSend
              : configuredBeforeSend
                ? [configuredBeforeSend]
                : []),
          ];
    posthog.init(config.key, {
      api_host: config.host,
      capture_pageview: options.capture_pageview ?? "history_change",
      autocapture: options.autocapture ?? false,
      disable_session_recording: options.disable_session_recording ?? true,
      ...options,
      ...(beforeSend ? { before_send: beforeSend } : {}),
    });
  }

  return {
    track(event, properties) {
      posthog.capture(event, properties);
    },
    identify(userId, traits) {
      posthog.identify(userId, traits);
    },
    reset() {
      posthog.reset();
    },
    page(name, properties) {
      posthog.capture("$pageview", { name, ...properties });
    },
    async flush() {
      // posthog-js queues internally and flushes on its own interval,
      // using sendBeacon on page unload — nothing to do here.
    },
  };
}
