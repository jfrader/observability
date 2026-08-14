import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
  flush: vi.fn(async () => true),
}));

import { captureException, captureMessage, init } from "@sentry/node";

import { createSentryNodeErrorReporter } from "../src/providers/sentry-node.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSentryNodeErrorReporter", () => {
  it("inits with dsn and errors-only tracing by default", () => {
    createSentryNodeErrorReporter({ dsn: "dsn://y", environment: "production" });
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "dsn://y", environment: "production", tracesSampleRate: 0 }),
    );
  });

  it("forwards capture context", () => {
    const reporter = createSentryNodeErrorReporter({ dsn: "dsn://y" });
    const error = new Error("boom");
    reporter.captureException(error, { extra: { reqId: "r1" } });
    expect(captureException).toHaveBeenCalledWith(error, { extra: { reqId: "r1" } });
    reporter.captureMessage("hi", "error", { tags: { url: "/x" } });
    expect(captureMessage).toHaveBeenCalledWith("hi", { level: "error", tags: { url: "/x" } });
  });

  it("default beforeSend scrubs request urls", () => {
    createSentryNodeErrorReporter({ dsn: "dsn://y" });
    const beforeSend = vi.mocked(init).mock.calls[0][0].beforeSend as (event: any) => any;
    const event = beforeSend({ request: { url: "https://x.com/?token=abc" } });
    expect(event.request.url).not.toContain("abc");
  });
});
