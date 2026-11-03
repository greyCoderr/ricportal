import { formatDateTimeManila } from "../../../lib/dates";
import { LABELS } from "../../../lib/labels";
import { useHealth } from "../hooks";

// Placeholder page for Phase 0: shows the result of GET /api/health.
// Plain Tailwind utilities only; Figma tokens arrive in P0-T11.
export function HealthPage() {
  const health = useHealth();

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-2xl font-semibold">{LABELS.appName}</h1>

      {health.isPending && (
        <p role="status" className="text-gray-600">
          Checking the server…
        </p>
      )}

      {health.isError && (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-red-800"
        >
          <p>{health.error.message}</p>
          <button
            type="button"
            className="mt-2 rounded bg-red-700 px-3 py-1 text-white disabled:opacity-60"
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
          className="rounded border border-green-300 bg-green-50 p-3 text-green-900"
        >
          <p>Server: {health.data.status}</p>
          <p>Database: {health.data.db}</p>
          <p className="text-sm">
            Checked at {formatDateTimeManila(health.data.time)}
          </p>
        </section>
      )}
    </main>
  );
}
