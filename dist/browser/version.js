import { useCallback, useEffect, useRef, useState } from "react";
const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_RELOAD_DELAY_MS = 250;
const DEFAULT_SERVER_VERSION_PATH = "/version.json";
const DEFAULT_STORAGE_KEY = "observability-reloaded-for";
function readReloadedFor(storageKey) {
    try {
        return window.sessionStorage.getItem(storageKey);
    }
    catch {
        return null;
    }
}
function writeReloadedFor(storageKey, version) {
    try {
        if (version === null)
            window.sessionStorage.removeItem(storageKey);
        else
            window.sessionStorage.setItem(storageKey, version);
    }
    catch {
        // No sessionStorage (old private mode): the prompt may simply repeat.
    }
}
const DYNAMIC_IMPORT_ERROR_PATTERNS = [
    /failed to fetch dynamically imported module/i,
    /error loading dynamically imported module/i,
    /importing a module script failed/i,
    /chunkloaderror/i,
];
function errorMessage(error) {
    if (typeof error === "string")
        return error;
    if (error instanceof Error)
        return error.message;
    if (error && typeof error === "object" && "message" in error) {
        const message = error.message;
        return typeof message === "string" ? message : null;
    }
    return null;
}
/**
 * True when an error is a stale-chunk failure: the classic symptom of a deploy
 * landing while the user still runs an old bundle. Reloading fixes it.
 */
export function isDynamicImportError(error) {
    const message = errorMessage(error);
    if (!message)
        return false;
    return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}
export function useVersionReload(options) {
    const { currentVersion, serverVersionPath = DEFAULT_SERVER_VERSION_PATH, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, reloadDelayMs = DEFAULT_RELOAD_DELAY_MS, disabled = false, onReload, storageKey = DEFAULT_STORAGE_KEY, } = options;
    const [serverVersion, setServerVersion] = useState(null);
    const [promptedVersion, setPromptedVersion] = useState(null);
    const [open, setOpen] = useState(false);
    const [tick, setTick] = useState(0);
    const onReloadRef = useRef(onReload);
    onReloadRef.current = onReload;
    const pollIntervalRef = useRef(pollIntervalMs);
    pollIntervalRef.current = pollIntervalMs;
    const active = !disabled && typeof currentVersion === "string" && currentVersion !== "" && currentVersion !== "dev";
    useEffect(() => {
        if (!active)
            return;
        let cancelled = false;
        const check = async () => {
            try {
                const response = await fetch(serverVersionPath, { cache: "no-store" });
                if (!response.ok)
                    return;
                const document = (await response.json());
                if (typeof document.version === "string" && !cancelled) {
                    setServerVersion(document.version.trim());
                }
            }
            catch {
                // Offline or the file does not exist: keep the current version.
            }
        };
        void check();
        const id = window.setInterval(check, pollIntervalRef.current);
        window.addEventListener("focus", check);
        return () => {
            cancelled = true;
            window.clearInterval(id);
            window.removeEventListener("focus", check);
        };
    }, [active, serverVersionPath, tick]);
    const updateAvailable = Boolean(active && serverVersion && serverVersion !== currentVersion);
    useEffect(() => {
        if (!updateAvailable || open || promptedVersion === serverVersion)
            return;
        // Already reloaded for this exact version: CDN edge lag after a deploy, not
        // a new deploy. Do not insist; the next poll will find a consistent pair.
        if (serverVersion && readReloadedFor(storageKey) === serverVersion)
            return;
        setPromptedVersion(serverVersion);
        setOpen(true);
    }, [updateAvailable, open, promptedVersion, serverVersion, storageKey]);
    // Bundle and server agree: the reload (if any) did its job. Clear the marker
    // so the NEXT deploy prompts normally.
    useEffect(() => {
        if (active && serverVersion && serverVersion === currentVersion) {
            writeReloadedFor(storageKey, null);
        }
    }, [active, serverVersion, currentVersion, storageKey]);
    const reload = useCallback(() => {
        const version = serverVersion;
        setOpen(false);
        if (!version || readReloadedFor(storageKey) === version)
            return;
        writeReloadedFor(storageKey, version);
        window.setTimeout(() => {
            const reloadFn = onReloadRef.current;
            if (reloadFn)
                reloadFn();
            else
                window.location.reload();
        }, reloadDelayMs);
    }, [serverVersion, storageKey, reloadDelayMs]);
    const dismiss = useCallback(() => {
        setOpen(false);
    }, []);
    const refetch = useCallback(() => {
        setTick((current) => current + 1);
    }, []);
    return { serverVersion, updateAvailable, promptOpen: open, reload, dismiss, refetch };
}
//# sourceMappingURL=version.js.map