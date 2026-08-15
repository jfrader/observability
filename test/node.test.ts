import { describe, expect, it, vi } from "vitest";

import { captureRequestError } from "../src/node/index.js";
import type { Observability } from "../src/types.js";

describe("captureRequestError", () => {
  it("tags only the request path", () => {
    const captureException = vi.fn();
    const observability = { captureException } as unknown as Observability;
    const error = new Error("boom");

    captureRequestError(
      observability,
      { id: "r1", method: "GET", url: "/invite?token=secret#fragment", statusCode: 500 },
      error,
    );

    expect(captureException).toHaveBeenCalledWith(error, {
      tags: { method: "GET", path: "/invite" },
      extra: { reqId: "r1", statusCode: 500 },
    });
  });
});
