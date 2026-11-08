import { manilaToday } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { EXTRA_LINKS_BY_ROLE } from "../../../app/layouts/nav";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Card,
  EmptyState,
  Icon,
  StatusBadge,
  Table,
  type IconName,
} from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { FeedingCalendar } from "../../calendar/components/FeedingCalendar";
import { useCalendar, type DayRange } from "../../calendar/hooks";
import { useReports } from "../../reports/hooks";
import { useDashboardSummary } from "../hooks";
import { FIT_SCREEN } from "../../../lib/layout";

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
    <Card
      variant="stat"
      className={`flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center ${alert ? "border-danger" : ""}`}
    >
      <span
        className={`inline-flex size-[clamp(2.75rem,8cqh,4.5rem)] shrink-0 items-center justify-center rounded-full ${
          alert
            ? "bg-danger-soft text-danger-text"
            : "bg-accent-soft text-accent"
        }`}
      >
        <Icon name={icon} size={28} />
      </span>
      <p className="mt-1 text-40 leading-tight font-semibold tabular-nums">
        {value ?? "-"}
      </p>
      {/* Title case, as Figma 267:9689 sets it (Plan 3 D4). */}
      <p data-card-label className="text-13 leading-snug">
        {label}
      </p>
    </Card>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center gap-3 rounded-control bg-accent-soft p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
    >
      <span className="inline-flex size-[3.5rem] shrink-0 items-center justify-center rounded-icon bg-accent text-primary-contrast">
        <Icon name={icon} size={26} />
      </span>
      <span className="min-w-0">
        <span className="block text-15 font-semibold">{title}</span>
        <span className="block text-12 font-medium">{description}</span>
      </span>
    </Link>
  );
}

const ACTION_DETAILS: Record<string, { icon: IconName; description: string }> =
  {
    "/centers": {
      icon: "map-pin",
      description: "Add and rename the RIC Children Centers",
    },
    "/menu-imports": {
      icon: "upload",
      description: "Upload the DSWD menu for the feeding calendar",
    },
  };

// Admin Dashboard (Figma 267:9689). The six cards of D6, with real counts. The
// enrollment and accomplishment counts stay 0 until Objective 3. On a desktop the
// page fits the content area with no scrolling (D3).
export function AdminDashboardPage() {
  const navigate = useNavigate();
  const summary = useDashboardSummary();
  const reports = useReports(1);
  const [range, setRange] = useState<DayRange | null>(null);
  const calendar = useCalendar(range);
  const counts = summary.data;
  const recent = reports.data?.data.slice(0, 4) ?? [];

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <div className={`flex flex-col ${FIT_SCREEN}`}>
      <h1 className="mb-3 text-24 font-bold lg:text-40">Admin Dashboard</h1>
      <QueryBoundary
        query={summary}
        errorTitle="Could not load the dashboard counts."
      >
        <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 compact:grid-cols-6 compact:gap-5">
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
            value={counts?.reports.submitted}
            label="Reports Submitted"
          />
          <CountCard
            icon="file-text"
            value={counts?.submittedByType.enrollment}
            label="Enrollment Reports Submitted"
          />
          <CountCard
            icon="circle-check"
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

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)] compact:min-h-0 compact:flex-1 compact:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 compact:min-h-0">
          <section className="shrink-0">
            <h2 className="mb-1 text-16 tracking-label">Quick Actions</h2>
            <div className="grid gap-3 rounded-card border border-border-subtle p-3 sm:grid-cols-2">
              <QuickAction
                to="/reports"
                icon="file-text"
                title="View reports"
                description="Review the liquidation reports of the centers"
              />
              <QuickAction
                to="/teachers"
                icon="users"
                title="RIC Teachers"
                description="Add teachers and reset their passwords"
              />
              {EXTRA_LINKS_BY_ROLE.ADMIN.map((item) => {
                const details = ACTION_DETAILS[item.to];
                return (
                  <QuickAction
                    key={item.to}
                    to={item.to}
                    icon={details?.icon ?? "file-text"}
                    title={item.label}
                    description={details?.description ?? ""}
                  />
                );
              })}
            </div>
          </section>

          <section className="rounded-card border border-border-subtle p-3 compact:min-h-0 compact:flex-1 compact:overflow-y-auto">
            <h2 className="mb-2 flex items-center gap-2 text-16">
              <Icon name="file-text" size={20} className="text-accent" />
              Recent Reports
            </h2>
            <QueryBoundary
              query={reports}
              errorTitle="Could not load the recent reports."
            >
              {recent.length === 0 ? (
                <EmptyState title="No liquidation reports have been submitted yet." />
              ) : (
                <>
                  <Table
                    cardsOnPhone
                    cardsUntilDesktop
                    caption="Recent Reports"
                    rows={recent}
                    rowKey={(row) => row.id}
                    columns={[
                      {
                        key: "teacher",
                        header: "Teacher Name",
                        render: (row) => row.teacherName,
                      },
                      {
                        key: "period",
                        header: "Report Type",
                        render: (row) =>
                          `Liquidation, ${formatDate(row.periodStart)}`,
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
                  <p className="text-center">
                    <Link
                      to="/reports"
                      className="inline-flex min-h-11 items-center text-13 compact:min-h-6 text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                    >
                      View All Reports
                    </Link>
                  </p>
                </>
              )}
            </QueryBoundary>
          </section>
        </div>

        <section className="flex min-w-0 flex-col compact:min-h-0">
          <div className="compact:min-h-0 compact:flex-1">
            <FeedingCalendar
              fit
              days={calendar.data ?? []}
              selectedDate={manilaToday()}
              onRangeChange={handleRange}
              onDayClick={() => {
                void navigate("/calendar");
              }}
            />
          </div>
          {/* Figma 268:11203: a label, then a dashed box with the action. The
              importer reads .xlsx only (DEC-045), so the text says so. */}
          <div className="mx-auto mt-3 w-full max-w-[30rem] shrink-0">
            <p className="text-13 font-medium tracking-label">
              Upload Menu Document
            </p>
            <Link
              to="/calendar"
              className="mt-1 flex min-h-11 flex-col gap-1 rounded-control border border-dashed border-danger-text bg-danger-soft px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
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
