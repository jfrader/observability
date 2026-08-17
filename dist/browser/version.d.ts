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
/**
 * True when an error is a stale-chunk failure: the classic symptom of a deploy
 * landing while the user still runs an old bundle. Reloading fixes it.
 */
export declare function isDynamicImportError(error: unknown): boolean;
export declare function useVersionReload(options: VersionReloadOptions): VersionReloadState;
