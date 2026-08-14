// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsProvider } from "../src/types.js";

vi.mock("posthog-js", () => {
  const posthog = {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    flush: vi.fn(async () => {}),
  };
  return { default: posthog, posthog };
});

import type { Mock } from "vitest";
import { posthog } from "posthog-js";

type PosthogMock = typeof posthog & {
  init: Mock;
  capture: Mock;
  identify: Mock;
  reset: Mock;
};

const posthogMock = posthog as PosthogMock;

// Fresh module instance per test so the adapter's init-once guard resets.
const loadAdapter = async () => {
  vi.resetModules();
  const { createPosthogBrowserAnalytics } = await import("../src/providers/posthog-browser.js");
  return createPosthogBrowserAnalytics;
};

beforeEach(() => {
  for (const key of ["init", "capture", "identify", "reset", "flush"] as const) {
    posthogMock[key].mockClear();
  }
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createPosthogBrowserAnalytics", () => {
  it("inits with privacy-first defaults", async () => {
    const create = await loadAdapter();
    create({ key: "phc_key", host: "https://us.i.posthog.com" });
    expect(posthogMock.init).toHaveBeenCalledWith("phc_key", {
      api_host: "https://us.i.posthog.com",
      capture_pageview: true,
      autocapture: false,
      disable_session_recording: true,
    });
  });

  it("only inits once across multiple creations", async () => {
    const create = await loadAdapter();
    create({ key: "phc_key", host: "https://us.i.posthog.com" });
    create({ key: "phc_key", host: "https://us.i.posthog.com" });
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });

  it("delegates track/identify/reset/page/flush", async () => {
    const create = await loadAdapter();
    const analytics: AnalyticsProvider = create({ key: "phc_key", host: "https://us.i.posthog.com" });
    analytics.track("signup", { plan: "pro" });
    expect(posthogMock.capture).toHaveBeenCalledWith("signup", { plan: "pro" });
    analytics.identify("u1", { email: "a@b.c" });
    expect(posthogMock.identify).toHaveBeenCalledWith("u1", { email: "a@b.c" });
    analytics.reset?.();
    expect(posthogMock.reset).toHaveBeenCalled();
    analytics.page?.("/home");
    expect(posthogMock.capture).toHaveBeenCalledWith("$pageview", { name: "/home" });
    await analytics.flush?.();
  });

  it("passes through extra init options", async () => {
    const create = await loadAdapter();
    create({
      key: "phc_key",
      host: "https://us.i.posthog.com",
      options: { capture_pageview: false, persistence: "memory" },
    });
    expect(posthogMock.init).toHaveBeenCalledWith(
      "phc_key",
      expect.objectContaining({ capture_pageview: false, persistence: "memory" }),
    );
  });
});
