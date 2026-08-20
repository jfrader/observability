---
name: observability-integration
description: Integrate @jfrader/observability into browser and Node applications with privacy-safe Sentry error reporting, meaningful PostHog analytics, stable identity, exact environment and release metadata, source maps, lifecycle handling, and live verification. Use when adding or changing observability, telemetry, analytics events, error capture, session replay, or provider configuration.
license: MIT
---

# Observability integration

Use `@jfrader/observability` as the application boundary around error reporting
and analytics. Keep product semantics in the application and provider mechanics
in one observability module.

## Workflow

1. Inspect the application before editing:
   - existing Sentry, PostHog, analytics, logging, and error-boundary setup;
   - browser and server entry points, request error handlers, and shutdown hooks;
   - runtime environments, deploy authorities, release identifiers, and source-map builds;
   - URLs, route parameters, payloads, and identities that may contain secrets or personal data.
2. Define the telemetry contract before adding calls:
   - unexpected failures that belong in error tracking;
   - a small set of meaningful completed product actions;
   - the stable pseudonymous identity and allowed event properties;
   - exact `production`, `testnet`, and `development` environment names.
3. Create one application-owned observability module. Configure providers there
   and export one facade. Do not initialize Sentry or PostHog in feature code.
4. Wire lifecycle boundaries: application startup, React root/error boundary,
   authenticated identity settlement, logout/reset, request failures, fatal
   process errors, and shutdown flush.
5. Declare provider values in every deployment environment. A missing DSN or
   key intentionally selects the silent noop provider.
6. Test configuration, privacy, identity, event timing, and failure behavior.
7. Deploy only a CI-verified commit, then query the live provider using the
   exact project, environment, release, and event names.

## Browser setup

Install only the peers in use, such as `@sentry/react` and `posthog-js`.

```ts
import {
  createBrowserObservability,
  readBrowserEnv,
} from "@jfrader/observability/browser";
import { createPosthogBrowserAnalytics } from "@jfrader/observability/providers/posthog-browser";
import { createSentryBrowserErrorReporter } from "@jfrader/observability/providers/sentry-browser";

const appName = "my-app";
const environment = import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.MODE;
const version = import.meta.env.VITE_APP_VERSION;
const env = readBrowserEnv(import.meta.env);

export const observability = createBrowserObservability({
  appName,
  environment,
  errorReporter: env.sentryDsn
    ? createSentryBrowserErrorReporter({
        dsn: env.sentryDsn,
        environment,
        release: version ? `${appName}@${version}` : undefined,
      })
    : undefined,
  analytics: env.posthogKey
    ? createPosthogBrowserAnalytics({
        key: env.posthogKey,
        host: env.posthogHost ?? "https://us.i.posthog.com",
      })
    : undefined,
});
```

For React, place `ObservabilityProvider` and
`ObservabilityErrorBoundary` at the root. Use the application's own accessible
fallback UI when one exists. Keep rendering functional when every provider is
absent or blocked.

Use `useTrack()` or the shared facade in features. Do not import provider SDKs
at call sites. Lazy provider loading is acceptable when boot performance needs
it, but expose a stable noop-backed facade while provider chunks load.

## Node setup

Install only the peers in use, such as `@sentry/node` and `posthog-node`.

```ts
import {
  captureRequestError,
  createNodeObservability,
  readNodeEnv,
} from "@jfrader/observability/node";
import { createSentryNodeErrorReporter } from "@jfrader/observability/providers/sentry-node";

const appName = "my-api";
const environment = process.env.APP_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
const version = process.env.RELEASE_SHA;
const env = readNodeEnv();

export const observability = createNodeObservability({
  appName,
  environment,
  errorReporter: env.sentryDsn
    ? createSentryNodeErrorReporter({
        dsn: env.sentryDsn,
        environment,
        release: version ? `${appName}@${version}` : undefined,
      })
    : undefined,
});

export { captureRequestError };
```

Initialize before requests are accepted. Capture unexpected server failures
from the framework's central error handler, not from every route. Expected
validation, authentication, conflict, not-found, and other handled 4xx outcomes
normally do not belong in Sentry.

Pass normalized route templates rather than raw tokenized paths. Attach only
bounded diagnostic context such as request ID, method, status, and safe domain
identifiers. If the application owns `uncaughtException` or
`unhandledRejection`, avoid duplicate provider integrations, capture the fatal
error once, flush with a bound, then preserve the application's exit behavior.

Call `await observability.flush()` during graceful shutdown. Server-side
PostHog events otherwise may remain queued.

## Privacy and identity

The adapters provide safe defaults, not complete knowledge of application data.

- Keep DSNs, project keys, hosts, and runtime environment values in deployment
  configuration. Never hardcode them in application source.
- A Sentry DSN or public PostHog project key may be browser-visible. A Sentry
  auth token, personal API key, or source-map upload credential is build-only
  secret material and must never enter a browser bundle or persistent runner.
- Built-in redaction scrubs common credentials from URL-like fields. Add
  `redact.additionalQueryKeys` and provider hooks for app-specific invitation,
  share, payment, recovery, or join tokens. Recursively scrub nested event and
  breadcrumb strings when those tokens can appear outside URL fields.
- Prefer a stable opaque account ID. Do not send email, username, display name,
  access tokens, share codes, complete payloads, or arbitrary exception objects
  as analytics properties.
- Set Sentry user context and PostHog identity only after authentication state
  is authoritative. While identity is pending, suppress pageviews, feature flag
  requests, surveys, and replay so anonymous activity cannot be joined to the
  wrong account.
- On logout or account switching, call `observability.setUser(null)` and reset
  analytics identity with `observability.analytics.reset?.()` before settling
  the next account.
- Keep PostHog `autocapture` and session recording disabled unless the product
  explicitly needs them. If replay is enabled, mask all inputs and exclude
  authentication, payment, embedded, administrative, and secret-bearing routes.
- Use `person_profiles: "identified_only"` when anonymous profiles add no
  product value. Disable feature flags and surveys when the application does
  not consume them.

## Product events

Track user intent and completed outcomes, not every click.

- Use stable lower-case event names such as `project_opened`, `tip_started`, or
  `manager_action`.
- Capture after the authoritative outcome: after navigation is accepted, after
  a server acknowledgement, or after a payment reaches the state named by the
  event. Do not report optimistic UI as completion.
- Keep properties allowlisted, low-cardinality where practical, and useful for
  a concrete product question. Prefer enums, booleans, counts, and safe IDs.
- Do not put secrets, free-form user content, URLs with tokens, or full API
  responses into events.
- Test modified-click, keyboard, retry, duplicate-submit, cancellation, and
  failure paths so one logical action emits the intended number of events.
- Distinguish activity from adoption. Pageviews or distinct IDs prove traffic;
  a domain event from an identified account proves feature use.

## Environment, releases, and source maps

- Use explicit provider environments such as `production`, `testnet`, and
  `development`; do not derive production labels from unstable host strings.
- Use one immutable release convention: `<appName>@<git-sha-or-version>`. Client,
  server, worker, deploy metadata, and source-map upload must agree exactly.
- Inject browser environment and release values at build time. Declare server
  values in runtime configuration. Empty values must preserve noop behavior.
- Upload source maps from the exact production artifact after a successful
  build. Keep the upload credential out of images and client assets. Do not
  expose source maps publicly unless that is an intentional reviewed choice.
- Verify the running release from deployment or application evidence. Creating
  a Sentry release alone does not prove that code is live.

## Verification

Before merge, verify the affected boundaries:

- no-provider startup and noop behavior;
- configured provider options, environment, and release;
- URL, breadcrumb, nested-token, and event-property redaction;
- identity pending, login, logout, and account-switch transitions;
- one event at the authoritative success point and none on cancellation/failure;
- expected 4xx responses are not reported while unexpected 5xx/fatal errors are;
- shutdown flush is bounded and invoked;
- the production build does not contain secret upload credentials;
- the package or application build, typecheck, tests, configured lint, and artifact checks.

After deployment:

1. Confirm the deployed commit and health endpoint first.
2. Query Sentry by the exact project, environment, and release. Inspect one safe
   event when available and confirm route, context, and redaction.
3. Query PostHog only after confirming the event and property names in that
   project's live schema. Verify identity and event counts separately.
4. Treat zero events as a valid result only when the provider query succeeded.
   A failed query, stale export, or missing environment is not zero activity.
5. Record the commit, deployment status, checks, and any unavailable live proof
   in the tracked work item.

## Avoid

- Provider initialization spread across feature files.
- Capturing every handled error or every click.
- Raw request URLs as grouping tags.
- PII or bearer material in users, breadcrumbs, context, or analytics.
- Anonymous replay while account identity is unresolved.
- Source maps uploaded under a different release from the deployed bundle.
- Declaring success from SDK initialization, a Sentry release row, or a
  PostHog project alone. Verify emitted data or state the evidence gap.

Use the package README for the current API and entry points. Application
deployment rules and privacy constraints override generic examples in this
skill.
