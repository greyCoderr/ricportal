import { manilaToday, type ReportDto } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { TopBarTitle } from "../../../components/TopBarTitle";
import {
  EmptyState,
  Icon,
  StatusBadge,
  Table,
  Tabs,
  type IconName,
} from "../../../components/ui";
import { formatInstantDate } from "../../../lib/format";
import { FIT_SCREEN } from "../../../lib/layout";
import { MiniCalendar } from "../../calendar/components/MiniCalendar";
import { useCalendar, type DayRange } from "../../calendar/hooks";
import { useReports } from "../../reports/hooks";
import { useDashboardSummary } from "../hooks";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

// Figma 267:9689: icon circle, big number, label, a 4 px bottom border (green,
// red for revision).
function CountCard({
  icon,
  value,
  label,
  alert = false,
}: {
  icon: IconName;
  value: number | undefined;
  label: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center rounded-card border-b-4 bg-surface px-2 py-3 text-center shadow-card ${
        alert ? "border-b-danger" : "border-b-accent"
      }`}
    >
      <span
        className={`inline-flex size-[clamp(2.75rem,7cqh,4rem)] shrink-0 items-center justify-center rounded-full ${
          alert
            ? "bg-danger-soft text-danger-text"
            : "bg-accent-soft text-accent"
        }`}
      >
        <Icon name={icon} size={28} />
      </span>
      <p
        data-card-value
        className="mt-1 text-40 leading-tight font-semibold text-accent tabular-nums"
      >
        {value ?? "-"}
      </p>
      {/* Title case, as Figma 267:9689 sets it (Plan 3 D4). */}
      <p data-card-label className="text-13 leading-snug">
        {label}
      </p>
    </div>
  );
}

// Figma's tiles: three green, the fourth yellow (Plan 4 D3).
function QuickAction({
  to,
  icon,
  title,
  description,
  tone = "green",
}: {
  to: string;
  icon: IconName;
  title: string;
  description: string;
  tone?: "green" | "yellow";
}) {
  return (
    <Link
      to={to}
      className={`flex min-w-0 items-center gap-3 rounded-control p-3 compact:p-2 ${
        tone === "yellow" ? "bg-warning-soft" : "bg-accent-soft"
      } ${FOCUS}`}
    >
      <span
        className={`inline-flex size-14 shrink-0 items-center justify-center rounded-icon compact:size-12 ${
          tone === "yellow"
            ? "bg-warning text-text"
            : "bg-accent text-primary-contrast"
        }`}
      >
        <Icon name={icon} size={26} />
      </span>
      <span className="min-w-0">
        <span data-action-title className="block text-15 font-semibold">
          {title}
        </span>
        <span className="block text-12 font-medium">{description}</span>
      </span>
    </Link>
  );
}

function LiquidationTable({ rows }: { rows: ReportDto[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState title="No liquidation reports have been submitted yet." />
    );
  }
  return (
    <Table
      cardsOnPhone
      cardsUntilDesktop
      caption="Recent Reports"
      rows={rows}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "teacher",
          header: "Teacher Name",
          render: (row) => row.teacherName,
        },
        {
          key: "type",
          header: "Report Type",
          render: () => "Liquidation Report",
        },
        {
          key: "date",
          header: "Date Submitted",
          render: (row) => formatInstantDate(row.submittedAt),
        },
        {
          key: "status",
          header: "Status",
          render: (row) => <StatusBadge status={row.status} />,
        },
      ]}
    />
  );
}

// Admin Dashboard (Figma 267:9689, Plan 4 D1 to D5). The enrollment and
// accomplishment counts stay 0 until Objective 3. On a desktop the page fits the
// content area with no scrolling.
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const summary = useDashboardSummary();
  const reports = useReports(1);
  const [range, setRange] = useState<DayRange | null>(null);
  const calendar = useCalendar(range);
  const counts = summary.data;
  const recent =
    reports.data?.data
      .filter((report) => report.type === "LIQUIDATION")
      .slice(0, 4) ?? [];

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <div className={`flex flex-col ${FIT_SCREEN}`}>
      {/* In the header row, as Figma 267:9689 (Plan 4). */}
      <TopBarTitle>Admin Dashboard</TopBarTitle>
      <QueryBoundary
        query={summary}
        errorTitle="Could not load the dashboard counts."
      >
        <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 compact:grid-cols-5 compact:gap-6">
          <CountCard
            icon="users"
            value={counts?.activeTeachers}
            label="Registered RIC Teacher"
          />
          <CountCard
            icon="users"
            value={counts?.enrolledStudents}
            label="Total Enrolled Students"
          />
          <CountCard
            icon="file-text"
            value={counts?.submittedByType.enrollment}
            label="Enrollment Reports Submitted"
          />
          <CountCard
            icon="file-text"
            value={counts?.submittedByType.accomplishment}
            label="Accomplishment Reports Submitted"
          />
          <CountCard
            alert
            icon="circle-alert"
            value={counts?.reports.needRevision}
            label="Reports for Revision"
          />
        </div>
      </QueryBoundary>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)] compact:mt-4 compact:min-h-0 compact:flex-1 compact:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 compact:min-h-0 compact:gap-3">
          <section aria-labelledby="quick-actions" className="shrink-0">
            <h2 id="quick-actions" className="mb-1 text-16 tracking-label">
              Quick Actions
            </h2>
            <div className="grid gap-3 rounded-card border border-border-subtle p-3 sm:grid-cols-2 compact:gap-2">
              <QuickAction
                to="/reports"
                icon="inbox"
                title="Send Feedback"
                description="Review reports and send feedback to teachers"
              />
              <QuickAction
                to="/admin/students"
                icon="users"
                title="Monitor Enrolled Students"
                description="View and monitor student records by center"
              />
              <QuickAction
                to="/teachers"
                icon="user"
                title="RIC Teachers"
                description="Add teachers and reset their passwords"
              />
              <QuickAction
                tone="yellow"
                to="/reports"
                icon="file-text"
                title="View Reports"
                description="Check the liquidation reports"
              />
            </div>
          </section>

          <section className="flex flex-col rounded-card border border-border-subtle p-3 compact:min-h-0 compact:flex-1 compact:overflow-y-auto">
            <h2 className="mb-2 flex shrink-0 items-center gap-2 text-16">
              <Icon name="chart-column" size={20} />
              Recent Reports
            </h2>
            <Tabs
              variant="pill"
              label="Recent Reports"
              items={[
                {
                  id: "liquidation",
                  label: "Liquidation Reports",
                  content: (
                    <QueryBoundary
                      query={reports}
                      errorTitle="Could not load the recent reports."
                    >
                      <LiquidationTable rows={recent} />
                    </QueryBoundary>
                  ),
                },
                {
                  id: "enrollment",
                  label: "Enrollment Reports",
                  content: <EmptyState title="No reports yet." />,
                },
                {
                  id: "accomplishment",
                  label: "Accomplishment Reports",
                  content: <EmptyState title="No reports yet." />,
                },
              ]}
            />
            <p className="mt-auto pt-1 text-center">
              <Link
                to="/reports"
                className={`inline-flex min-h-11 items-center gap-1 text-13 text-accent compact:min-h-6 ${FOCUS}`}
              >
                View All Reports
                <span aria-hidden="true">›</span>
              </Link>
            </p>
          </section>
        </div>

        <section
          aria-label="Feeding calendar"
          className="flex min-w-0 flex-col compact:min-h-0"
        >
          <div className="h-[24rem] compact:h-auto compact:min-h-0 compact:flex-1">
            <MiniCalendar
              days={calendar.data ?? []}
              today={manilaToday()}
              onRangeChange={handleRange}
              onDayClick={(date) => {
                void navigate(`/calendar?date=${date}`);
              }}
            />
          </div>
          {/* Figma 268:11203: a label, then a dashed box with the action. The
              importer reads .xlsx only (DEC-045), so the text says so. */}
          <div className="mx-auto mt-3 w-full max-w-[30rem] shrink-0 compact:mt-2">
            <p className="text-13 font-medium tracking-label">
              Upload Menu Document
            </p>
            <Link
              to="/calendar"
              className={`mt-1 flex min-h-11 flex-col gap-1 rounded-control border border-dashed border-danger-text bg-danger-soft px-4 py-2 compact:py-1.5 ${FOCUS}`}
            >
              <span className="flex items-center gap-2 text-15 font-semibold tracking-label text-danger-text">
                <Icon name="upload" size={18} />
                Upload Menu/Food Rotation
              </span>
              <span className="text-12 tracking-label">
                Upload the DSWD Excel file (.xlsx) with the menu/food rotation
                for this month.
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
