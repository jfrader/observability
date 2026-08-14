/**
 * PostHog (node) strategy. Requires the optional peer `posthog-node`.
 * Events are sent with a single distinct id (set via `identify`, or the
 * `defaultDistinctId` option); call `flush()` before the process exits.
 */

import { PostHog } from "posthog-node";
import type { AnalyticsProvider } from "../types.js";

export interface PosthogNodeConfig {
  key: string;
  /** e.g. `https://us.i.posthog.com` */
  host?: string;
  /** Distinct id used until `identify` is called. Defaults to "server". */
  defaultDistinctId?: string;
  /** Any other `PostHog` constructor option. */
  options?: Record<string, unknown>;
}

export function createPosthogNodeAnalytics(config: PosthogNodeConfig): AnalyticsProvider {
  const client = new PostHog(config.key, {
    host: config.host,
    ...config.options,
  });

  let distinctId = config.defaultDistinctId ?? "server";

  return {
    track(event, properties) {
      client.capture({ distinctId, event, properties });
    },
    identify(userId, traits) {
      distinctId = userId;
      client.identify({ distinctId: userId, properties: traits });
    },
    reset() {
      distinctId = config.defaultDistinctId ?? "server";
    },
    async flush() {
      await client.flush();
    },
  };
}
