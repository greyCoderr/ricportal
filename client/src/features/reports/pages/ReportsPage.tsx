import { useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  EmptyState,
  Pagination,
  StatusBadge,
  Table,
} from "../../../components/ui";
import { formatPeso } from "../../../lib/format";
import { useCurrentUser } from "../../auth/components/guards";
import { useReports } from "../hooks";

// Teacher: own reports. Admin: the queue, newest first; filters are cut
// (docs/SPRINT_SHORTCUTS.md).
export function ReportsPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";
  const [page, setPage] = useState(1);
  const reports = useReports(page);
  return (
    <>
      <PageHeader
        title={isAdmin ? "Reports" : "Report Status"}
        description={
          isAdmin
            ? "Liquidation reports submitted by the RIC Teachers."
            : `Liquidation reports of ${user.centerName ?? "your center"}.`
        }
      />
      <QueryBoundary query={reports} errorTitle="Could not load the reports.">
        {reports.data?.data.length === 0 ? (
          <EmptyState
            title={
              isAdmin
                ? "No liquidation reports have been submitted yet."
                : `${user.centerName ?? "Your center"} has not submitted a liquidation report yet.`
            }
          >
            {isAdmin
              ? undefined
              : "Open the Calendar and choose Liquidation Forms to submit one."}
          </EmptyState>
        ) : (
          <>
            <Table
              caption="Liquidation reports"
              rows={reports.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "period",
                  header: "Period",
                  render: (row) => (
                    <Link
                      to={`/reports/${String(row.id)}`}
                      className="font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                    >
                      {row.periodStart} to {row.periodEnd}
                    </Link>
                  ),
                },
                ...(isAdmin
                  ? [
                      {
                        key: "center",
                        header: "Center",
                        render: (row: { centerName: string }) => row.centerName,
                      },
                    ]
                  : []),
                {
                  key: "total",
                  header: "Total",
                  align: "right" as const,
                  render: (row) => formatPeso(row.total),
                },
                {
                  key: "version",
                  header: "Version",
                  align: "right" as const,
                  render: (row) => String(row.currentVersion),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge status={row.status} />,
                },
              ]}
            />
            <Pagination
              page={reports.data?.meta.page ?? page}
              pageSize={reports.data?.meta.pageSize ?? 20}
              total={reports.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
