import { Component, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

type Fallback = (args: { error: Error; reset: () => void }) => ReactNode;

type ErrorBoundaryProps = { fallback?: Fallback; children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

function reloadPage() {
  window.location.reload();
}

// The approved page-level fallback (docs/ui-specs/ui-kit.md, ErrorState).
const pageFallback: Fallback = () => (
  <ErrorState
    title="Something went wrong on this page."
    message="Reload the page to try again."
    onRetry={reloadPage}
    retryLabel="Reload"
  />
);

// Catches render errors below it and shows the fallback. React still needs a
// class component for this.
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
      const fallback = this.props.fallback ?? pageFallback;
      return fallback({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}
