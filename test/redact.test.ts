import { describe, expect, it } from "vitest";

import {
  SENSITIVE_QUERY_KEYS,
  redactBreadcrumbUrls,
  redactLongTokens,
  redactSensitiveUrl,
} from "../src/redact.js";

describe("redactSensitiveUrl", () => {
  it("filters sensitive query keys on absolute URLs", () => {
    const url = "https://trucoshi.com/login?token=abc123&state=xyz&next=/home";
    const result = redactSensitiveUrl(url);
    expect(result).toBe("https://trucoshi.com/login?token=%5BFiltered%5D&state=%5BFiltered%5D&next=%2Fhome");
    expect(result).not.toContain("abc123");
    expect(result).not.toContain("xyz");
  });

  it("filters sensitive hash fragments", () => {
    const url = "https://trucoshi.com/callback#access_token=secret&expires_in=3600";
    expect(redactSensitiveUrl(url)).toBe("https://trucoshi.com/callback#filtered");
  });

  it("keeps innocent hash fragments", () => {
    const url = "https://trucoshi.com/board#share";
    expect(redactSensitiveUrl(url)).toBe("https://trucoshi.com/board#share");
  });

  it("handles relative URLs", () => {
    expect(redactSensitiveUrl("/teams/join/abc?code=1&foo=bar")).toBe("/teams/join/abc?code=%5BFiltered%5D&foo=bar");
  });

  it("redacts long opaque tokens anywhere in the string", () => {
    const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.x".slice(0, 43);
    const url = `https://trucoshi.com/teams/join/${token}?x=1`;
    const result = redactSensitiveUrl(url);
    expect(result).toContain("[redacted]");
    expect(result).not.toContain(token);
  });

  it("supports custom query keys", () => {
    const result = redactSensitiveUrl("https://x.com/?g=sharecode&token=abc", {
      queryKeys: new Set(["g"]),
    });
    expect(result).toContain("g=%5BFiltered%5D");
    expect(result).toContain("token=abc");
  });

  it("supports app-specific keys without disabling the defaults", () => {
    const result = redactSensitiveUrl("https://x.com/?g=sharecode&token=abc", {
      additionalQueryKeys: new Set(["g"]),
    });
    expect(result).toContain("g=%5BFiltered%5D");
    expect(result).toContain("token=%5BFiltered%5D");
  });

  it("filters query params case-insensitively", () => {
    const result = redactSensitiveUrl("https://x.com/?TOKEN=abc");
    expect(result).toContain("TOKEN=%5BFiltered%5D");
  });
});

describe("redactLongTokens", () => {
  it("redacts 43+ char alphanumeric runs", () => {
    const token = "1234567890123456789012345678901234567890123";
    expect(redactLongTokens(`join ${token}`)).toContain("[redacted]");
    expect(redactLongTokens(`join ${token}`)).not.toContain(token);
  });

  it("supports custom token regexes", () => {
    const regex = /(teams\/join(?:\/|#))[A-Za-z0-9_-]{43}(?=$|[/?#&])/g;
    const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a";
    expect(token).toHaveLength(63);
    const token43 = token.slice(0, 43);
    expect(redactLongTokens(`/teams/join/${token43}`, regex)).toBe("/teams/join/[redacted]");
  });
});

describe("redactBreadcrumbUrls", () => {
  it("scrubs url/from/to data fields in place", () => {
    const breadcrumb = {
      message: "fetch",
      data: {
        url: "https://x.com/?token=abc",
        from: "/teams/join/" + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789a".slice(0, 43),
        to: "https://y.com/ok",
        count: 3,
      },
    };
    redactBreadcrumbUrls(breadcrumb);
    expect(breadcrumb.data!.url).not.toContain("abc");
    expect(breadcrumb.data!.url).toContain("Filtered");
    expect(breadcrumb.data!.from).toContain("[redacted]");
    expect(breadcrumb.data!.to).toBe("https://y.com/ok");
    expect(breadcrumb.data!.count).toBe(3);
  });
});

describe("SENSITIVE_QUERY_KEYS", () => {
  it("covers the common credential params", () => {
    for (const key of ["access_token", "api_key", "code", "id_token", "identity", "jwt", "password", "refresh_token", "secret", "state", "token"]) {
      expect(SENSITIVE_QUERY_KEYS.has(key), key).toBe(true);
    }
  });
});
