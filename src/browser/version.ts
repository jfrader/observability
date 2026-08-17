import { useCallback, useEffect, useRef, useState } from "react";

/**
 * New-deploy detection for browser apps. Polls a small `version.json` served
 * next to the app and compares it against the version baked into the running
 * bundle. The hook owns the detection loop and the reload-loop guards; the app
 * owns the UI (it renders its own styled update modal from `promptOpen`).
 *
 * Loop-safety invariants (all covered by tests):
 * - A prompt fires at most once per server version per mount.
 * - Reloading records the server version in sessionStorage; the prompt never
 *   re-fires for that same version. This survives the reload itself, so a CDN
 *   that still serves the old HTML next to the new version.json cannot loop.
 * - The marker is cleared once bundle and server versions match again.
 * - The poller stops and its listeners detach on unmount; no state updates
 *   after unmount.
 * - The check is inert when `currentVersion` is missing or `"dev"`.
 */

export interface VersionReloadOptions {
  /** Version baked into this bundle at build time (e.g. a Vite define). */
  currentVersion: string;
  /** Path serving `{ "version": "..." }` relative to the app origin. */
  serverVersionPath?: string;
  /** How often to re-check for a new deploy. Defaults to 5 minutes. */
  pollIntervalMs?: number;
  /** Pause before reloading so the modal can close and repaint. */
  reloadDelayMs?: number;
  /** Disable all polling (e.g. embed/iframe builds). */
  disabled?: boolean;
  /** Custom reload action. Defaults to `window.location.reload()`. */
  onReload?: () => void;
  /** sessionStorage key for the per-version reload marker. */
  storageKey?: string;
}

export interface VersionReloadState {
  /** Version served by `/version.json`, when a successful check happened. */
  serverVersion: string | null;
  /** True when the served version differs from the bundled one. */
  updateAvailable: boolean;
  /** True while a new version is detected and awaiting user action. */
  promptOpen: boolean;
  /**
   * Record the current server version as reloaded-for and perform the reload.
   * Idempotent: calling it again for the same version is a no-op.
   */
  reload: () => void;
  /** Close the prompt; it will not re-open for the same server version. */
  dismiss: () => void;
  /** Run an immediate version check (e.g. from an error boundary). */
  refetch: () => void;
}

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_RELOAD_DELAY_MS = 250;
const DEFAULT_SERVER_VERSION_PATH = "/version.json";
const DEFAULT_STORAGE_KEY = "observability-reloaded-for";

interface VersionDocument {
  version?: unknown;
}

function readReloadedFor(storageKey: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeReloadedFor(storageKey: string, version: string | null): void {
  try {
    if (version === null) window.sessionStorage.removeItem(storageKey);
    else window.sessionStorage.setItem(storageKey, version);
  } catch {
    // No sessionStorage (old private mode): the prompt may simply repeat.
  }
}

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /chunkloaderror/i,
];

function errorMessage(error: unknown): string | null {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === "string" ? message : null;
  }
  return null;
}

/**
 * True when an error is a stale-chunk failure: the classic symptom of a deploy
 * landing while the user still runs an old bundle. Reloading fixes it.
 */
export function isDynamicImportError(error: unknown): boolean {
  const message = errorMessage(error);
  if (!message) return false;
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function useVersionReload(options: VersionReloadOptions): VersionReloadState {
  const {
    currentVersion,
    serverVersionPath = DEFAULT_SERVER_VERSION_PATH,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    reloadDelayMs = DEFAULT_RELOAD_DELAY_MS,
    disabled = false,
    onReload,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [promptedVersion, setPromptedVersion] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  const pollIntervalRef = useRef(pollIntervalMs);
  pollIntervalRef.current = pollIntervalMs;

  const active =
    !disabled && typeof currentVersion === "string" && currentVersion !== "" && currentVersion !== "dev";

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch(serverVersionPath, { cache: "no-store" });
        if (!response.ok) return;
        const document = (await response.json()) as VersionDocument;
        if (typeof document.version === "string" && !cancelled) {
          setServerVersion(document.version.trim());
        }
      } catch {
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

  const updateAvailable = Boolean(
    active && serverVersion && serverVersion !== currentVersion,
  );

  useEffect(() => {
    if (!updateAvailable || open || promptedVersion === serverVersion) return;
    // Already reloaded for this exact version: CDN edge lag after a deploy, not
    // a new deploy. Do not insist; the next poll will find a consistent pair.
    if (serverVersion && readReloadedFor(storageKey) === serverVersion) return;
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
    if (!version || readReloadedFor(storageKey) === version) return;
    writeReloadedFor(storageKey, version);
    window.setTimeout(() => {
      const reloadFn = onReloadRef.current;
      if (reloadFn) reloadFn();
      else window.location.reload();
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
