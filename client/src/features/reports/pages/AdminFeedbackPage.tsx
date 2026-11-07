import type { FeedbackDto } from "@ricportal/shared";
import { useState } from "react";
import { Link } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Card,
  EmptyState,
  Icon,
  Pagination,
  StatusBadge,
  Table,
} from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { useFeedback, useReports } from "../hooks";

const LINK =
  "inline-flex h-11 items-center justify-center gap-2 rounded-control px-4 text-13 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

function period(row: FeedbackDto): string {
  return `${formatDate(row.periodStart)} to ${formatDate(row.periodEnd)}`;
}

function Count({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: number | undefined;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-13 font-medium">{label}</p>
      <p className="text-24 font-semibold tabular-nums">{value ?? "-"}</p>
      <p className="text-12 text-text-secondary">{hint}</p>
    </Card>
  );
}

function Details({ row }: { row: FeedbackDto }) {
  return (
    <section className="flex flex-col gap-3 rounded-control border border-border-subtle p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-15 font-semibold">Selected Feedback Details</h2>
        <StatusBadge status={row.reportStatus} />
      </div>
      <p className="text-18 font-semibold tabular-nums">{period(row)}</p>
      <dl className="grid grid-cols-2 gap-2 text-13">
        <div>
          <dt className="text-text-secondary">Report Type</dt>
          <dd>Liquidation, version {row.versionNo}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Date Reviewed</dt>
          <dd className="tabular-nums">{formatInstantDate(row.reviewedAt)}</dd>
        </div>
      </dl>
      <div>
        <h3 className="mb-1 text-13 font-medium">Admin Feedback</h3>
        <p className="rounded-control bg-tag-tint p-3 text-15 whitespace-pre-wrap">
          {row.feedback}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {row.reportStatus === "NEED_REVISION" && (
          <Link
            to="/calendar"
            className={`${LINK} bg-primary text-primary-contrast hover:bg-primary-hover`}
          >
            Revise Report
          </Link>
        )}
        <Link
          to={`/reports/${String(row.reportId)}`}
          className={`${LINK} border border-border-subtle hover:border-border`}
        >
          View Full Report
        </Link>
      </div>
    </section>
  );
}

// Admin Feedback (Figma 78:276, D10): what the Administrator wrote on returned
// liquidation reports. The frame's Feedback Guide, remark types and timeline have
// no data before Objective 3 and are left out (DEC-041).
export function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const feedback = useFeedback(page);
  const returned = useReports(1, "NEED_REVISION");
  const rows = feedback.data?.data ?? [];
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  return (
    <>
      <h1 className="text-24 font-semibold text-accent lg:text-40">
        Admin Feedback
      </h1>
      <p className="mb-4 text-15 text-text-secondary">
        Review detailed feedback from the admin for your liquidation reports.
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Count
          label="Total Feedback"
          hint="All time feedback received"
          value={feedback.data?.meta.total}
        />
        <Count
          label="Needs Revision"
          hint="Reports need your action"
          value={returned.data?.meta.total}
        />
      </div>
      <QueryBoundary query={feedback} errorTitle="Could not load the feedback.">
        {rows.length === 0 ? (
          <EmptyState title="No feedback from the Administrator yet.">
            Feedback appears here when a liquidation report is sent back.
          </EmptyState>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <section className="min-w-0 rounded-control border border-border-subtle p-3">
              <h2 className="mb-2 text-15 font-semibold">Feedback Records</h2>
              <Table
                cardsOnPhone
                caption="Feedback Records"
                rows={rows}
                rowKey={(row) => row.id}
                rowClassName={(row) =>
                  row.id === selected?.id ? "bg-header" : ""
                }
                columns={[
                  {
                    key: "title",
                    header: "Report Title",
                    render: (row) => period(row),
                  },
                  {
                    key: "date",
                    header: "Date Reviewed",
                    render: (row) => formatInstantDate(row.reviewedAt),
                  },
                  {
                    key: "status",
                    header: "Feedback Status",
                    render: (row) => <StatusBadge status={row.reportStatus} />,
                  },
                  {
                    key: "action",
                    header: "Action",
                    render: (row) => (
                      <button
                        type="button"
                        aria-label={`Show the feedback of ${period(row)}, version ${String(row.versionNo)}`}
                        aria-pressed={row.id === selected?.id}
                        className="inline-flex size-11 items-center justify-center rounded-control border border-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                        onClick={() => {
                          setSelectedId(row.id);
                        }}
                      >
                        <Icon name="eye" size={20} />
                      </button>
                    ),
                  },
                ]}
              />
              <Pagination
                page={feedback.data?.meta.page ?? page}
                pageSize={feedback.data?.meta.pageSize ?? 20}
                total={feedback.data?.meta.total ?? 0}
                onPageChange={setPage}
              />
            </section>
            {selected !== undefined && <Details row={selected} />}
          </div>
        )}
      </QueryBoundary>
    </>
  );
}
