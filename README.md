# @jfrader/observability

Strategy-based observability for small apps, one tiny API, zero runtime
dependencies. Error tracking (Sentry by default) and analytics (PostHog by
default) behind a strategy pattern, so you can switch providers — or drop
them — by changing one import and one env var.

It is the shared observability layer used by all jfrader apps (MiFulbo,
Huertoku, Civiku, Trucoshi, jfrader.com, Gurisitos). See
`changelog-lib` for the sibling release-notes system.

## Why a strategy pattern

Small apps have few users and little budget. The default choices here are
free-tier-friendly and privacy-first:

| Concern | Default provider | Free tier | Alternative strategies |
|---|---|---|---|
| Errors | Sentry | 5k errors/mo | noop |
| Analytics | PostHog | 1M events/mo | noop, custom beacon (Plausible/Umami-compatible) |

Both are behind interfaces (`ErrorReporter`, `AnalyticsProvider`), so any
provider can be swapped without touching call sites. Provider SDKs are
optional peer dependencies: install only what you actually use.

## Install

```bash
npm install @jfrader/observability            # core (always)
npm install @sentry/react posthog-js          # only if you use those providers
# server-side: @sentry/node posthog-node
```

## React (browser) quick start

```tsx
// src/observability.ts
import { createBrowserObservability, readBrowserEnv } from "@jfrader/observability/browser";
import { createSentryBrowserErrorReporter } from "@jfrader/observability/providers/sentry-browser";
import { createPosthogBrowserAnalytics } from "@jfrader/observability/providers/posthog-browser";

const env = readBrowserEnv(import.meta.env); // VITE_SENTRY_DSN, VITE_PUBLIC_POSTHOG_KEY, ...

export const observability = createBrowserObservability({
  appName: "huertoku",
  environment: import.meta.env.MODE,
  errorReporter: env.sentryDsn
    ? createSentryBrowserErrorReporter({ dsn: env.sentryDsn, environment: import.meta.env.MODE })
    : undefined,
  analytics: env.posthogKey
    ? createPosthogBrowserAnalytics({ key: env.posthogKey, host: env.posthogHost ?? "https://us.i.posthog.com" })
    : undefined, // or createBeaconAnalytics({ endpoint: env.analyticsUrl })
});
```

```tsx
// main.tsx
import { ObservabilityProvider, ObservabilityErrorBoundary } from "@jfrader/observability/browser";
import { observability } from "./observability";

createRoot(document.getElementById("root")!).render(
  <ObservabilityProvider value={observability}>
    <ObservabilityErrorBoundary fallback={<AppErrorScreen />}>
      <App />
    </ObservabilityErrorBoundary>
  </ObservabilityProvider>,
);
```

```tsx
// anywhere
const track = useTrack();
track("game_completed", { score: 12 });
```

## Node (server) quick start

```ts
// src/observability.ts
import { createNodeObservability, readNodeEnv } from "@jfrader/observability/node";
import { createSentryNodeErrorReporter } from "@jfrader/observability/providers/sentry-node";

const env = readNodeEnv(); // SENTRY_DSN, POSTHOG_KEY, ...

export const observability = createNodeObservability({
  appName: "mifulbo-api",
  environment: process.env.NODE_ENV ?? "development",
  errorReporter: env.sentryDsn ? createSentryNodeErrorReporter({ dsn: env.sentryDsn }) : undefined,
});

// Fastify:
app.setErrorHandler((error, request, reply) => {
  captureRequestError(observability, request, error);
  reply.send(error);
});
```

## Switching providers

| Want | Change |
|---|---|
| No analytics (dev) | omit `analytics` (or set env vars empty) — noop fallback |
| PostHog → Plausible/Umami/own endpoint | import `createBeaconAnalytics` instead of the PostHog adapter; set `VITE_ANALYTICS_URL` |
| Sentry → nothing | omit `errorReporter` |
| Any future provider | implement `ErrorReporter` / `AnalyticsProvider` (one file) |

## Package entries

| Entry | Contents | Peer deps |
|---|---|---|
| `@jfrader/observability` | types, facade, noop, redaction utils, env readers | — |
| `@jfrader/observability/browser` | facade + React (`ObservabilityProvider`, `useTrack`, `ObservabilityErrorBoundary`) | `react` (optional) |
| `@jfrader/observability/node` | facade + `captureRequestError` | — |
| `@jfrader/observability/providers/sentry-browser` | `createSentryBrowserErrorReporter` | `@sentry/react` |
| `@jfrader/observability/providers/sentry-node` | `createSentryNodeErrorReporter` | `@sentry/node` |
| `@jfrader/observability/providers/posthog-browser` | `createPosthogBrowserAnalytics` | `posthog-js` |
| `@jfrader/observability/providers/posthog-node` | `createPosthogNodeAnalytics` | `posthog-node` |

## Env conventions

Browser (`readBrowserEnv(import.meta.env, prefix)`):

- `VITE_SENTRY_DSN` — enable Sentry
- `VITE_PUBLIC_POSTHOG_KEY` (+ `VITE_PUBLIC_POSTHOG_HOST`, default `https://us.i.posthog.com`)
- `VITE_ANALYTICS_URL` — custom beacon endpoint

Node (`readNodeEnv()`): same names without the `VITE_` prefix.

## Privacy defaults

- Sentry adapters scrub credentials/tokens from URLs and breadcrumbs by
  default (`redact` option), send no PII, errors only (`tracesSampleRate: 0`).
- PostHog browser adapter: autocapture off, session recording off.
- Beacon adapter: sends `{ name, data, url, ts }`, supports `redactUrl`
  to strip share codes; never throws.
- Noop fallbacks: no provider configured → no network calls, no console noise.

## Publishing

Push an annotated `v<package-version>` tag from `main`. The release workflow
checks the tag and lockfile, builds and tests once, packs one immutable tarball,
then verifies or publishes that exact artifact to npmjs and GitHub Packages.
Retries are safe: an existing matching artifact is accepted, while a different
artifact at the same version fails the release.

The npmjs package uses a trusted publisher for
`jfrader/observability` → `.github/workflows/publish.yml`; GitHub Packages uses
the workflow's scoped `GITHUB_TOKEN`. Until the trusted publisher is linked on
npmjs, publish npmjs manually instead:

```bash
npm publish --registry=https://registry.npmjs.org
```

(The `--registry` flag is required because `~/.npmrc` maps the `@jfrader`
scope to GitHub Packages.)

GitHub creates a personal package as private on its first publication. After
the first workflow succeeds, make it public once from the package's **Package
settings → Danger Zone → Change visibility**. Later versions keep that setting.
