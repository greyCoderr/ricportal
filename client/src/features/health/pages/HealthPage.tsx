import { formatDateTimeManila } from "../../../lib/dates";
import { LABELS } from "../../../lib/labels";
import { useHealth } from "../hooks";

// Placeholder page for Phase 0: shows the result of GET /api/health.
// Semantic token classes only (DEC-022).
export function HealthPage() {
  const health = useHealth();

  return (
    <main className="mx-auto max-w-md bg-surface p-4 text-text">
      <h1 className="mb-4 text-24 font-semibold">{LABELS.appName}</h1>

      {health.isPending && (
        <p role="status" className="text-text-muted">
          Checking the server…
        </p>
      )}

      {health.isError && (
        <div
          role="alert"
          className="rounded-control border border-danger bg-danger-soft p-3 text-danger-text"
        >
          <p>{health.error.message}</p>
          <button
            type="button"
            className="mt-2 rounded-control bg-primary px-3 py-1 text-primary-contrast disabled:opacity-60"
            disabled={health.isFetching}
            onClick={() => {
              void health.refetch();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {health.isSuccess && (
        <section
          aria-label="System status"
          className="rounded-control border border-success bg-success-soft p-3 text-text"
        >
          <p>Server: {health.data.status}</p>
          <p>Database: {health.data.db}</p>
          <p className="text-13">
            Checked at {formatDateTimeManila(health.data.time)}
          </p>
        </section>
      )}
    </main>
  );
}
