import type { ReportDto, ReportStatus } from "@ricportal/shared";
import { useState } from "react";
import { Link } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Icon,
  Pagination,
  Select,
  StatusBadge,
  Table,
  type TableColumn,
} from "../../../components/ui";
import { formatDate, formatInstantDate, formatPeso } from "../../../lib/format";
import { useCurrentUser } from "../../auth/components/guards";
import { useDashboardSummary } from "../../dashboard/hooks";
import { SelectedReportDetails } from "../components/SelectedReportDetails";
import { useReports } from "../hooks";

const STATUS_FILTERS: { value: ReportStatus; label: string }[] = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "NEED_REVISION", label: "Need Revision" },
  { value: "APPROVED", label: "Approved" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-11-01" as "November 2026".
export function monthOf(day: string): string {
  return `${MONTHS[Number(day.slice(5, 7)) - 1] ?? ""} ${day.slice(0, 4)}`;
}

function periodTitle(report: ReportDto): string {
  return `${formatDate(report.periodStart)} to ${formatDate(report.periodEnd)}`;
}

function StatusCount({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-13">{label}</p>
      <p className="text-24 font-semibold tabular-nums">{value ?? "-"}</p>
    </Card>
  );
}

function AdminStatusCards() {
  const summary = useDashboardSummary();
  const reports = summary.data?.reports;
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <StatusCount label="Submitted" value={reports?.submitted} />
      <StatusCount label="Need Revision" value={reports?.needRevision} />
      <StatusCount label="Approved" value={reports?.approved} />
    </div>
  );
}

// Reports (Figma 268:12661, phones 378:15917): for the Admin the queue of every
// center, for a Teacher the own center (D10). Only liquidation reports exist before
// Objective 3, so the Report Type filter and tabs of the frame are left out.
export function ReportsPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === "ADMIN";
  const center = user.centerName ?? "your center";
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<ReportStatus | "">("");
  const [status, setStatus] = useState<ReportStatus | undefined>(undefined);
  const reports = useReports(page, status);
  const rows = reports.data?.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = selectedId ?? rows[0]?.id ?? null;
  const firstNumber = (page - 1) * (reports.data?.meta.pageSize ?? 20) + 1;

  function apply(next: ReportStatus | "") {
    setStatus(next === "" ? undefined : next);
    setPage(1);
  }

  const columns: TableColumn<ReportDto>[] = [
    {
      key: "number",
      header: "#",
      render: (row) => firstNumber + rows.indexOf(row),
    },
    {
      key: "type",
      header: "Report Type",
      render: () => <Badge tone="info">Liquidation</Badge>,
    },
    {
      key: "title",
      header: "Report Title / Description",
      render: (row) => (
        <Link
          to={`/reports/${String(row.id)}`}
          className="inline-flex min-h-11 items-center font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text lg:min-h-0"
        >
          {periodTitle(row)}
        </Link>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "teacher",
            header: "RIC Teacher",
            render: (row: ReportDto) => row.teacherName,
          },
          {
            key: "center",
            header: "Barangay",
            render: (row: ReportDto) => row.centerName,
          },
        ]
      : []),
    {
      key: "month",
      header: "Month",
      render: (row) => monthOf(row.periodStart),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => formatPeso(row.total),
    },
    {
      key: "submitted",
      header: "Submitted On",
      render: (row) => formatInstantDate(row.submittedAt),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        isAdmin ? (
          <Link
            to={`/reports/${String(row.id)}`}
            aria-label={`View the report for ${periodTitle(row)}`}
            className="inline-flex size-11 items-center justify-center rounded-control border border-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            <Icon name="eye" size={20} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={`Show the details of ${periodTitle(row)}`}
            aria-pressed={row.id === selected}
            className="inline-flex size-11 items-center justify-center rounded-control border border-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text aria-pressed:bg-header"
            onClick={() => {
              setSelectedId(row.id);
            }}
          >
            <Icon name="eye" size={20} />
          </button>
        ),
    },
  ];

  return (
    <>
      <h1 className="text-24 font-semibold tracking-label lg:text-40">
        {isAdmin ? "Reports" : "Report Status"}
      </h1>
      <p className="mb-4 text-15 text-text-secondary">
        {isAdmin
          ? "Liquidation reports submitted by the RIC Teachers."
          : `Track the status of your report. Liquidation reports of ${center}.`}
      </p>
      {isAdmin && <AdminStatusCards />}
      <div
        className={`grid gap-4 min-[1720px]:grid-cols-[minmax(0,1fr)_20rem] min-[1720px]:items-start ${
          isAdmin
            ? ""
            : "compact:min-[1360px]:grid-cols-[minmax(0,1fr)_20rem] compact:min-[1360px]:items-start"
        }`}
      >
        <section className="min-w-0 rounded-control border border-border-subtle p-3">
          <h2 className="mb-2 text-15 font-semibold">
            {isAdmin ? "All Reports List" : "Recent Submitted Reports"}
          </h2>
          <QueryBoundary
            query={reports}
            errorTitle="Could not load the reports."
          >
            {rows.length === 0 ? (
              <EmptyState
                title={
                  status !== undefined
                    ? "No reports have this status."
                    : isAdmin
                      ? "No liquidation reports have been submitted yet."
                      : `${user.centerName ?? "Your center"} has not submitted a liquidation report yet.`
                }
              >
                {!isAdmin && status === undefined
                  ? "Open the Calendar and choose Liquidation Forms to submit one."
                  : undefined}
              </EmptyState>
            ) : (
              <>
                <Table
                  cardsOnPhone
                  cardsUntilDesktop
                  caption="Liquidation reports"
                  rows={rows}
                  rowKey={(row) => row.id}
                  columns={columns}
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
        </section>
        <aside
          className={`grid min-w-0 content-start gap-3 lg:grid-cols-2 min-[1720px]:grid-cols-1 ${
            isAdmin ? "" : "compact:min-[1360px]:grid-cols-1"
          }`}
        >
          {!isAdmin && selected !== null && (
            <SelectedReportDetails reportId={selected} />
          )}
          <div className="flex flex-col gap-3 rounded-control border border-border-subtle p-4">
            <h2 className="text-15 font-semibold">Filter Reports</h2>
            <FormField label="Status">
              {(field) => (
                <Select
                  {...field}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value as ReportStatus | "");
                  }}
                >
                  <option value="">All Status</option>
                  {STATUS_FILTERS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            <Button
              onClick={() => {
                apply(draft);
              }}
            >
              Apply Filter
            </Button>
            <Button
              variant="secondary"
              icon="refresh-cw"
              onClick={() => {
                setDraft("");
                apply("");
              }}
            >
              Reset Filter
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
