import { afterEach, describe, expect, it, vi } from "vitest";

const captureMock = vi.fn();
const identifyMock = vi.fn();
const flushMock = vi.fn(async () => {});

vi.mock("posthog-node", () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: captureMock,
    identify: identifyMock,
    flush: flushMock,
  })),
}));

import { PostHog } from "posthog-node";

import { createPosthogNodeAnalytics } from "../src/providers/posthog-node.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("createPosthogNodeAnalytics", () => {
  it("constructs the client with key and host", () => {
    createPosthogNodeAnalytics({ key: "phc_key", host: "https://us.i.posthog.com" });
    expect(PostHog).toHaveBeenCalledWith("phc_key", { host: "https://us.i.posthog.com" });
  });

  it("tracks with the default distinct id", () => {
    const analytics = createPosthogNodeAnalytics({ key: "phc_key" });
    analytics.track("server_ready", { v: 1 });
    expect(captureMock).toHaveBeenCalledWith({ distinctId: "server", event: "server_ready", properties: { v: 1 } });
  });

  it("identify() switches the distinct id for later events", () => {
    const analytics = createPosthogNodeAnalytics({ key: "phc_key" });
    analytics.identify("user_7", { plan: "pro" });
    expect(identifyMock).toHaveBeenCalledWith({ distinctId: "user_7", properties: { plan: "pro" } });
    analytics.track("played", { n: 2 });
    expect(captureMock).toHaveBeenCalledWith({ distinctId: "user_7", event: "played", properties: { n: 2 } });
  });

  it("reset() restores the default distinct id", () => {
    const analytics = createPosthogNodeAnalytics({ key: "phc_key", defaultDistinctId: "bot" });
    analytics.identify("user_7");
    analytics.reset?.();
    analytics.track("t");
    expect(captureMock).toHaveBeenCalledWith({ distinctId: "bot", event: "t", properties: undefined });
  });

  it("flush() flushes the client", async () => {
    const analytics = createPosthogNodeAnalytics({ key: "phc_key" });
    await analytics.flush?.();
    expect(flushMock).toHaveBeenCalled();
  });
});
