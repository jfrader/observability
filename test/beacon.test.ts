// @vitest-environment jsdom
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createBeaconAnalytics } from "../src/beacon.js";

let beaconMock: ReturnType<typeof vi.fn>;

const setupSendBeacon = () => {
  beaconMock = vi.fn(() => true);
  Object.defineProperty(navigator, "sendBeacon", {
    value: beaconMock,
    configurable: true,
    writable: true,
  });
  // jsdom's Blob lacks arrayBuffer(); use Node's for reading payloads.
  vi.stubGlobal("Blob", NodeBlob);
};

const readBlob = async (blob: Blob): Promise<string> =>
  new TextDecoder().decode(await blob.arrayBuffer());

const setUrl = (url: string) => {
  window.history.replaceState({}, "", url);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createBeaconAnalytics", () => {
  it("sends the huertoku-compatible payload via sendBeacon", async () => {
    setupSendBeacon();
    setUrl("/?g=sharecode&foo=1");
    const analytics = createBeaconAnalytics({ endpoint: "/api/v1/events" });
    analytics.track("game_completed", { score: 12 });

    expect(beaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = beaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/v1/events");
    expect(blob.type).toBe("application/json");
    const payload = JSON.parse(await readBlob(blob));
    expect(payload.name).toBe("game_completed");
    expect(payload.data).toEqual({ score: 12 });
    expect(payload.url).toContain("sharecode");
    expect(typeof payload.ts).toBe("number");
  });

  it("applies redactUrl before including the url", async () => {
    setupSendBeacon();
    setUrl("/?g=sharecode");
    const analytics = createBeaconAnalytics({
      endpoint: "/api/v1/events",
      redactUrl: (url) => {
        const parsed = new URL(url);
        parsed.searchParams.delete("g");
        return parsed.toString();
      },
    });
    analytics.track("game_completed");

    const [, blob] = beaconMock.mock.calls[0] as [string, Blob];
    const payload = JSON.parse(await readBlob(blob));
    expect(payload.url).not.toContain("sharecode");
  });

  it("supports custom payload builders", async () => {
    setupSendBeacon();
    const analytics = createBeaconAnalytics({
      endpoint: "/events",
      buildPayload: (event, properties) => ({ event, properties }),
    });
    analytics.track("click", { x: 1 });
    const [, blob] = beaconMock.mock.calls[0] as [string, Blob];
    expect(JSON.parse(await readBlob(blob))).toEqual({ event: "click", properties: { x: 1 } });
  });

  it("page() sends a page event", async () => {
    setupSendBeacon();
    const analytics = createBeaconAnalytics({ endpoint: "/events" });
    analytics.page("/home", { source: "menu" });
    const [, blob] = beaconMock.mock.calls[0] as [string, Blob];
    const payload = JSON.parse(await readBlob(blob));
    expect(payload.name).toBe("page");
    expect(payload.data).toEqual({ name: "/home", source: "menu" });
  });

  it("falls back to fetch keepalive when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const analytics = createBeaconAnalytics({ endpoint: "/events" });
    analytics.track("t");
    expect(fetchMock).toHaveBeenCalledWith("/events", expect.objectContaining({ keepalive: true }));
  });

  it("never throws on network failure", () => {
    setupSendBeacon();
    beaconMock.mockImplementation(() => {
      throw new Error("boom");
    });
    const analytics = createBeaconAnalytics({ endpoint: "/events" });
    expect(() => analytics.track("t")).not.toThrow();
  });
});
