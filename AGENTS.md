# AGENTS.md — @jfrader/observability

Guidelines for agents working in this repo or integrating this package into
jfrader apps.

## When integrating into an app

- Create the app's observability module once (e.g. `src/observability.ts`):
  - browser: `createBrowserObservability` from `@jfrader/observability/browser`,
  - node: `createNodeObservability` from `@jfrader/observability/node`.
- Wire providers in that module only: Sentry via
  `@jfrader/observability/providers/sentry-*`, PostHog via
  `@jfrader/observability/providers/posthog-*`, custom endpoint via
  `createBeaconAnalytics`.
- Read config from env with `readBrowserEnv(import.meta.env)` /
  `readNodeEnv()`; omit a provider when its env var is absent (noop fallback).
  Never hardcode DSNs/keys in app source.
- React apps: wrap the tree in `ObservabilityProvider` and put an
  `ObservabilityErrorBoundary` at the root. Apps with custom fallback UI pass
  their own `fallback`.
- Track meaningful events with `useTrack()` / `observability.track()`;
  never track share codes, tokens or other user-visible secrets.
- Server apps: report 500s through `captureRequestError(observability, request, error)`
  in the framework error handler; `flush()` before shutdown.

## When editing this repo

- Keep the core (`src/core.ts`, `src/redact.ts`, `src/env.ts`, `src/noop.ts`,
  `src/beacon.ts`, `src/types.ts`) free of provider SDK imports — provider
  SDKs are optional peers imported only in `src/providers/`.
- Adding a provider = new file in `src/providers/`, export map entry in
  `package.json`, and tests in `test/`. Keep the interface files small.
- Never import the `/browser` or `/node` entries from core.
- Run `npm run check` before committing (typecheck + tests + build).
- Release: bump `version` in `package.json` + `package-lock.json`, commit,
  tag `v<version>` (annotated). The workflow publishes to npmjs + GitHub
  Packages. npmjs needs the trusted publisher configured once per package.

## Linear workflow

- Track project work in Linear, project **Observability**: https://linear.app/gurisitosgames/project/observability-014e6c252dd7
- New ideas are added as Linear issues. Agents pick up issues, log the work being done on each issue (status, notes, dates), and move completed issues to Done.
- Read the `linear-workflow` skill (global: `~/.config/opencode/skills/linear-workflow/SKILL.md`) before creating or updating any issue.
