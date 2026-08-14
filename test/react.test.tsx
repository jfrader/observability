// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { createObservability } from "../src/browser/index.js";
import {
  ObservabilityErrorBoundary,
  ObservabilityProvider,
  useTrack,
} from "../src/browser/react.js";
import type { Observability } from "../src/types.js";

afterEach(() => {
  cleanup();
});

const Boom = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("kaboom");
  return <div>safe</div>;
};

describe("ObservabilityProvider / useTrack", () => {
  it("provides a track function via useTrack", () => {
    const analytics = { track: vi.fn(), identify: vi.fn(), flush: vi.fn(async () => {}) };
    const obs = createObservability({
      appName: "app",
      environment: "test",
      analytics,
    });

    const TrackButton = () => {
      const track = useTrack();
      return (
        <button type="button" onClick={() => track("clicked", { where: "test" })}>
          go
        </button>
      );
    };

    render(
      <ObservabilityProvider value={obs}>
        <TrackButton />
      </ObservabilityProvider>,
    );
    act(() => {
      screen.getByRole("button").click();
    });
    expect(analytics.track).toHaveBeenCalledWith("clicked", { where: "test" });
  });

  it("useTrack throws outside a provider", () => {
    const TrackButton = () => {
      const track = useTrack();
      return <button type="button" onClick={() => track("x")}>go</button>;
    };
    expect(() => render(<TrackButton />)).toThrow("ObservabilityProvider");
  });
});

describe("ObservabilityErrorBoundary", () => {
  it("reports the error and renders the fallback", () => {
    const captureException = vi.fn();
    const obs = {
      appName: "app",
      environment: "test",
      error: { captureException },
      analytics: { track: vi.fn() },
      track: vi.fn(),
      captureException,
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      identify: vi.fn(),
      page: vi.fn(),
      setTag: vi.fn(),
      setContext: vi.fn(),
      addBreadcrumb: vi.fn(),
      flush: vi.fn(async () => {}),
    } as unknown as Observability;

    render(
      <ObservabilityProvider value={obs}>
        <ObservabilityErrorBoundary fallback={<div>oops</div>}>
          <Boom shouldThrow />
        </ObservabilityErrorBoundary>
      </ObservabilityProvider>,
    );

    expect(screen.getByText("oops")).toBeDefined();
    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context] = captureException.mock.calls[0] as [Error, { extra: { componentStack: string } }];
    expect(error.message).toBe("kaboom");
    expect(context.extra.componentStack).toContain("Boom");
  });

  it("supports function fallbacks and onError hooks", () => {
    const captureException = vi.fn();
    const onError = vi.fn();
    const obs = {
      appName: "app",
      environment: "test",
      error: { captureException },
      analytics: { track: vi.fn() },
      track: vi.fn(),
      captureException,
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      identify: vi.fn(),
      page: vi.fn(),
      setTag: vi.fn(),
      setContext: vi.fn(),
      addBreadcrumb: vi.fn(),
      flush: vi.fn(async () => {}),
    } as unknown as Observability;

    render(
      <ObservabilityProvider value={obs}>
        <ObservabilityErrorBoundary fallback={(error: Error) => <div>caught: {error.message}</div>} onError={onError}>
          <Boom shouldThrow />
        </ObservabilityErrorBoundary>
      </ObservabilityProvider>,
    );

    expect(screen.getByText("caught: kaboom")).toBeDefined();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("is safe without a provider", () => {
    expect(() =>
      render(
        <ObservabilityErrorBoundary fallback={<div>oops</div>}>
          <Boom shouldThrow />
        </ObservabilityErrorBoundary>,
      ),
    ).not.toThrow();
    expect(screen.getByText("oops")).toBeDefined();
  });

  it("renders children when nothing throws", () => {
    render(
      <ObservabilityErrorBoundary fallback={<div>oops</div>}>
        <Boom shouldThrow={false} />
      </ObservabilityErrorBoundary>,
    );
    expect(screen.getByText("safe")).toBeDefined();
  });
});
