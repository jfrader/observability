import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
  flush: vi.fn(async () => true),
}));

import {
  addBreadcrumb,
  captureException,
  captureMessage,
  flush,
  init,
  setContext,
  setTag,
  setUser,
} from "@sentry/react";

import { createSentryBrowserErrorReporter } from "../src/providers/sentry-browser.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSentryBrowserErrorReporter", () => {
  it("inits with dsn/environment/release and errors-only tracing by default", () => {
    createSentryBrowserErrorReporter({
      dsn: "dsn://x",
      environment: "production",
      release: "app@1.0.0",
    });
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "dsn://x",
        environment: "production",
        release: "app@1.0.0",
        tracesSampleRate: 0,
        sendDefaultPii: false,
      }),
    );
  });

  it("forwards capture context", () => {
    const reporter = createSentryBrowserErrorReporter({ dsn: "dsn://x" });
    const error = new Error("boom");
    reporter.captureException(error, { extra: { a: 1 }, tags: { url: "/x" }, user: { id: "1" } });
    expect(captureException).toHaveBeenCalledWith(error, { extra: { a: 1 }, tags: { url: "/x" }, user: { id: "1" } });
  });

  it("delegates captureMessage/setUser/setTag/setContext/addBreadcrumb/flush", async () => {
    const reporter = createSentryBrowserErrorReporter({ dsn: "dsn://x" });
    reporter.captureMessage("hi", "warning");
    expect(captureMessage).toHaveBeenCalledWith("hi", { level: "warning" });
    reporter.setUser({ id: "1" });
    expect(setUser).toHaveBeenCalledWith({ id: "1" });
    reporter.setUser(null);
    expect(setUser).toHaveBeenCalledWith(null);
    reporter.setTag("k", "v");
    expect(setTag).toHaveBeenCalledWith("k", "v");
    reporter.setContext("c", { i: 1 });
    expect(setContext).toHaveBeenCalledWith("c", { i: 1 });
    reporter.addBreadcrumb?.({ message: "click", category: "ui" });
    expect(addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ message: "click", category: "ui" }));
    await reporter.flush?.(2000);
    expect(flush).toHaveBeenCalledWith(2000);
  });

  it("default beforeSend scrubs request urls and breadcrumbs", () => {
    createSentryBrowserErrorReporter({ dsn: "dsn://x" });
    const beforeSend = vi.mocked(init).mock.calls[0][0].beforeSend as (event: any) => any;

    const event = beforeSend({
      request: { url: "https://x.com/?token=abc", query_string: "token=abc" },
      breadcrumbs: [{ message: "fetch", data: { url: "https://x.com/?code=123" } }],
    });
    expect(event.request.url).not.toContain("abc");
    expect(event.request.query_string).toBeUndefined();
    expect(event.breadcrumbs[0].data.url).not.toContain("123");
  });

  it("can disable redaction", () => {
    createSentryBrowserErrorReporter({ dsn: "dsn://x", redact: false });
    const beforeSend = vi.mocked(init).mock.calls[0][0].beforeSend as (event: any) => any;
    const event = beforeSend({ request: { url: "https://x.com/?token=abc" } });
    expect(event.request.url).toBe("https://x.com/?token=abc");
  });

  it("chains app beforeSend after redaction", () => {
    const appBeforeSend = vi.fn((event: unknown) => event);
    createSentryBrowserErrorReporter({ dsn: "dsn://x", beforeSend: appBeforeSend });
    const beforeSend = vi.mocked(init).mock.calls[0][0].beforeSend as (event: any) => any;
    const event = beforeSend({ request: { url: "https://x.com/?token=abc" } });
    expect(appBeforeSend).toHaveBeenCalled();
    expect(event.request.url).not.toContain("abc");
  });
});
