import { Button } from "./Button";
import type { HeadingLevel } from "./EmptyState";
import { Icon } from "./icons";

type ErrorStateProps = {
  // Written by the screen, for example "Could not load the students of
  // {center}."
  title: string;
  // Usually the ApiError message from lib/api.ts.
  message?: string;
  headingLevel?: HeadingLevel;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
};

// Shown when loading a section fails (docs/ui-specs/ui-kit.md). An alert, so
// the failure is announced once.
export function ErrorState({
  title,
  message,
  headingLevel = 2,
  onRetry,
  retrying = false,
  retryLabel = "Retry",
}: ErrorStateProps) {
  const Heading = `h${String(headingLevel)}` as "h2" | "h3" | "h4";
  return (
    <div role="alert" className="flex flex-col items-start gap-2">
      <Icon name="circle-alert" size={24} className="text-danger-text" />
      <Heading className="text-16 font-semibold text-text">{title}</Heading>
      {message !== undefined && (
        <p className="text-15 text-text-secondary">{message}</p>
      )}
      {onRetry !== undefined && (
        <Button variant="secondary" loading={retrying} onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
