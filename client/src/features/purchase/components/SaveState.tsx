import { Button, Icon, Spinner } from "../../../components/ui";
import type { RowState } from "../use-row-autosave";

// Saving, Saved, or Failed with Retry. The state is announced politely, and a
// check mark confirms a save (DESIGN_LANGUAGE rules 5 and 8).
export function SaveState({
  state,
  message,
  onRetry,
}: {
  state: RowState;
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div aria-live="polite" className="min-h-5 text-12">
      {state === "saving" && (
        <span className="inline-flex items-center gap-1 text-text-secondary">
          <Spinner size={12} /> Saving
        </span>
      )}
      {state === "saved" && (
        <span className="inline-flex items-center gap-1 text-success">
          <Icon name="check" size={14} /> Saved
        </span>
      )}
      {state === "conflict" && <p className="text-warning-text">{message}</p>}
      {state === "failed" && (
        <span className="flex flex-wrap items-center gap-2 text-danger-text">
          <span>Failed{message === null ? "" : `: ${message}`}</span>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </span>
      )}
    </div>
  );
}
