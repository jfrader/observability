import { describe, expect, it, vi } from "vitest";

import { createObservability } from "../src/core.js";
import { createNoopAnalytics, createNoopErrorReporter } from "../src/noop.js";
import type { AnalyticsProvider, ErrorReporter } from "../src/types.js";

const makeErrorSpy = (): ErrorReporter & {
  captureException: ReturnType<typeof vi.fn>;
  captureMessage: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
  setTag: ReturnType<typeof vi.fn>;
  setContext: ReturnType<typeof vi.fn>;
  addBreadcrumb: ReturnType<typeof vi.fn>;
  flush: ReturnType<typeof vi.fn>;
} => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
  flush: vi.fn(async () => true),
});

const makeAnalyticsSpy = (withPage = true): AnalyticsProvider & {
  track: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  page: ReturnType<typeof vi.fn>;
  flush: ReturnType<typeof vi.fn>;
} => ({
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  page: withPage ? vi.fn() : undefined as never,
  flush: vi.fn(async () => {}),
});

describe("createObservability", () => {
  it("falls back to noops when no providers are given", async () => {
    const obs = createObservability({ appName: "app", environment: "test" });
    expect(obs.error).toBeDefined();
    expect(obs.analytics).toBeDefined();
    expect(() => obs.track("x")).not.toThrow();
    expect(() => obs.captureException(new Error("x"))).not.toThrow();
    await expect(obs.flush()).resolves.toBeUndefined();
  });

  it("delegates to the configured strategies", () => {
    const error = makeErrorSpy();
    const analytics = makeAnalyticsSpy();
    const obs = createObservability({
      appName: "app",
      environment: "test",
      errorReporter: error,
      analytics,
    });

    obs.track("signup", { plan: "pro" });
    expect(analytics.track).toHaveBeenCalledWith("signup", { plan: "pro" });

    const boom = new Error("boom");
    obs.captureException(boom, { tags: { url: "/x" } });
    expect(error.captureException).toHaveBeenCalledWith(boom, { tags: { url: "/x" } });

    obs.captureMessage("hi", "warning");
    expect(error.captureMessage).toHaveBeenCalledWith("hi", "warning", undefined);

    obs.setUser({ id: "1" });
    expect(error.setUser).toHaveBeenCalledWith({ id: "1" });

    obs.identify("u1", { plan: "pro" });
    expect(analytics.identify).toHaveBeenCalledWith("u1", { plan: "pro" });

    obs.setTag("env", "test");
    expect(error.setTag).toHaveBeenCalledWith("env", "test");

    obs.setContext("request", { id: "r1" });
    expect(error.setContext).toHaveBeenCalledWith("request", { id: "r1" });

    obs.addBreadcrumb({ message: "click" });
    expect(error.addBreadcrumb).toHaveBeenCalledWith({ message: "click" });

    obs.page("/home");
    expect(analytics.page).toHaveBeenCalledWith("/home", undefined);
  });

  it("falls back to a track(page) event when analytics has no page()", () => {
    const analytics = makeAnalyticsSpy(false);
    const obs = createObservability({ appName: "app", environment: "test", analytics });
    obs.page("/home", { source: "menu" });
    expect(analytics.track).toHaveBeenCalledWith("page", { name: "/home", source: "menu" });
  });

  it("flush() flushes both providers", async () => {
    const error = makeErrorSpy();
    const analytics = makeAnalyticsSpy();
    const obs = createObservability({
      appName: "app",
      environment: "test",
      errorReporter: error,
      analytics,
    });
    await obs.flush();
    expect(error.flush).toHaveBeenCalledWith(5000);
    expect(analytics.flush).toHaveBeenCalled();
  });
});

describe("noop providers", () => {
  it("never throw", () => {
    const error = createNoopErrorReporter();
    const analytics = createNoopAnalytics();
    expect(() => {
      error.captureException(new Error("x"), { extra: { a: 1 } });
      error.captureMessage("m", "fatal");
      error.setUser({ id: "1" });
      error.setTag("k", "v");
      error.setContext("c", {});
      error.addBreadcrumb?.({ message: "b" });
      analytics.track("e", {});
      analytics.identify("u");
      analytics.reset?.();
      analytics.page?.("/");
    }).not.toThrow();
  });
});
