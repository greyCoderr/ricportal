import { Component, type ReactNode } from "react";

type Fallback = (args: { error: Error; reset: () => void }) => ReactNode;

type ErrorBoundaryProps = { fallback: Fallback; children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

// Catches render errors below it and shows the fallback. React still needs a
// class component for this. The fallback is passed in; the ErrorState
// component becomes the usual fallback once its spec is approved.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(thrown: unknown): ErrorBoundaryState {
    return {
      error: thrown instanceof Error ? thrown : new Error(String(thrown)),
    };
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error !== null) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.reset,
      });
    }
    return this.props.children;
  }
}
