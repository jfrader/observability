import { Component, type Context, type ReactNode } from "react";
import type { Observability } from "../types.js";
/**
 * Provide an {@link Observability} facade to the component tree.
 * Use `useTrack` / `useObservability` to consume it.
 */
export declare function ObservabilityProvider({ value, children }: {
    value: Observability;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useObservability(): Observability;
/** `const track = useTrack()` — analytics that never breaks the UI. */
export declare function useTrack(): (event: string, properties?: Record<string, unknown>) => void;
export interface ObservabilityErrorBoundaryProps {
    children: ReactNode;
    /** Rendered instead of children after a caught error. */
    fallback?: ReactNode | ((error: Error) => ReactNode);
    /** Called before the error is reported. */
    onError?: (error: Error, info: {
        componentStack: string;
    }) => void;
}
interface ObservabilityErrorBoundaryState {
    error: Error | null;
}
/**
 * React error boundary that reports to the configured error reporter and
 * renders an optional fallback. Safe without a provider: reporting is skipped
 * when no `<ObservabilityProvider>` exists above.
 */
export declare class ObservabilityErrorBoundary extends Component<ObservabilityErrorBoundaryProps, ObservabilityErrorBoundaryState> {
    static contextType: Context<Observability | null>;
    context: Observability | null;
    state: ObservabilityErrorBoundaryState;
    static getDerivedStateFromError(error: Error): ObservabilityErrorBoundaryState;
    componentDidCatch(error: Error, info: {
        componentStack: string;
    }): void;
    render(): ReactNode;
}
export {};
