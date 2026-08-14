import { Component, createContext, useContext, type Context, type ReactNode } from "react";
import type { Observability } from "../types.js";

const ObservabilityContext: Context<Observability | null> = createContext<Observability | null>(null);

/**
 * Provide an {@link Observability} facade to the component tree.
 * Use `useTrack` / `useObservability` to consume it.
 */
export function ObservabilityProvider({ value, children }: { value: Observability; children: ReactNode }) {
  return <ObservabilityContext.Provider value={value}>{children}</ObservabilityContext.Provider>;
}

export function useObservability(): Observability {
  const observability = useContext(ObservabilityContext);
  if (!observability) {
    throw new Error("useObservability must be used within <ObservabilityProvider>");
  }
  return observability;
}

/** `const track = useTrack()` — analytics that never breaks the UI. */
export function useTrack(): (event: string, properties?: Record<string, unknown>) => void {
  const observability = useObservability();
  return (event, properties) => observability.track(event, properties);
}

export interface ObservabilityErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of children after a caught error. */
  fallback?: ReactNode | ((error: Error) => ReactNode);
  /** Called before the error is reported. */
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface ObservabilityErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary that reports to the configured error reporter and
 * renders an optional fallback. Safe without a provider: reporting is skipped
 * when no `<ObservabilityProvider>` exists above.
 */
export class ObservabilityErrorBoundary extends Component<
  ObservabilityErrorBoundaryProps,
  ObservabilityErrorBoundaryState
> {
  static contextType = ObservabilityContext;
  declare context: Observability | null;

  state: ObservabilityErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ObservabilityErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    this.props.onError?.(error, info);
    this.context?.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render(): ReactNode {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error);
      }
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
