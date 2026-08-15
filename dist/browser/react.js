import { jsx as _jsx } from "react/jsx-runtime";
import { Component, createContext, useContext } from "react";
const ObservabilityContext = createContext(null);
/**
 * Provide an {@link Observability} facade to the component tree.
 * Use `useTrack` / `useObservability` to consume it.
 */
export function ObservabilityProvider({ value, children }) {
    return _jsx(ObservabilityContext.Provider, { value: value, children: children });
}
export function useObservability() {
    const observability = useContext(ObservabilityContext);
    if (!observability) {
        throw new Error("useObservability must be used within <ObservabilityProvider>");
    }
    return observability;
}
/** `const track = useTrack()` — analytics that never breaks the UI. */
export function useTrack() {
    const observability = useObservability();
    return (event, properties) => observability.track(event, properties);
}
/**
 * React error boundary that reports to the configured error reporter and
 * renders an optional fallback. Safe without a provider: reporting is skipped
 * when no `<ObservabilityProvider>` exists above.
 */
export class ObservabilityErrorBoundary extends Component {
    static contextType = ObservabilityContext;
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        const context = this.props.onError?.(error, info);
        this.context?.captureException(error, {
            ...context,
            extra: { componentStack: info.componentStack, ...context?.extra },
        });
    }
    render() {
        if (this.state.error) {
            if (typeof this.props.fallback === "function") {
                return this.props.fallback(this.state.error);
            }
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
//# sourceMappingURL=react.js.map