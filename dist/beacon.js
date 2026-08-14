/**
 * Zero-dependency analytics for self-hosted or custom endpoints. Compatible
 * with huertoku's original beacon schema (`{ name, data, url, ts }`), which
 * works with Plausible, Umami or a tiny own endpoint.
 *
 * Never throws: if sending is impossible, the event is dropped.
 */
export function createBeaconAnalytics(config) {
    const currentUrl = () => {
        if (typeof window === "undefined")
            return "";
        const url = window.location.href;
        return config.redactUrl ? config.redactUrl(url) : url;
    };
    const buildPayload = (event, properties) => {
        if (config.buildPayload) {
            return config.buildPayload(event, properties);
        }
        return {
            name: event,
            data: properties ?? {},
            url: currentUrl(),
            ts: Date.now(),
        };
    };
    const send = (body) => {
        try {
            const payload = JSON.stringify(body);
            if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                navigator.sendBeacon(config.endpoint, new Blob([payload], { type: "application/json" }));
                return;
            }
            if (typeof fetch !== "undefined") {
                void fetch(config.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                }).catch(() => undefined);
            }
        }
        catch {
            // Analytics never breaks the app.
        }
    };
    return {
        track(event, properties) {
            send(buildPayload(event, properties));
        },
        page(name, properties) {
            send(buildPayload("page", { name, ...properties }));
        },
        identify() {
            // The custom endpoint schema has no user identity concept.
        },
        async flush() { },
    };
}
//# sourceMappingURL=beacon.js.map