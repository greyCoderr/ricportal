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
      className={`flex flex-col items-center p-4 text-center ${alert ? "border-danger" : ""}`}
    >
      <span
        className={`inline-flex size-16 items-center justify-center rounded-full ${
          alert
            ? "bg-danger-soft text-danger-text"
            : "bg-accent-soft text-accent"
        }`}
      >
        <Icon name={icon} size={32} />
      </span>
      <p className="mt-2 text-40 font-semibold tabular-nums">{value ?? "-"}</p>
      <p className="text-15 font-light">{label}</p>
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
      className="flex items-center gap-3 border border-border-subtle bg-accent-soft p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
    >
      <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-icon bg-accent text-primary-contrast">
        <Icon name={icon} size={32} />
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

// Admin Dashboard (Figma 267:9689). Real counts on the Figma cards (D10). The
// client's card names for report types are replaced by status, because only
// liquidation reports exist before Objective 3 (DEC-040).
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
    <>
      <h1 className="mb-4 text-24 font-semibold lg:text-40">Admin Dashboard</h1>
      <QueryBoundary
        query={summary}
        errorTitle="Could not load the dashboard counts."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
            icon="circle-check"
            value={counts?.reports.approved}
            label="Reports Approved"
          />
          <CountCard
            alert
            icon="circle-alert"
            value={counts?.reports.needRevision}
            label="Reports for Revision"
          />
        </div>
      </QueryBoundary>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <h2 className="mb-2 text-16 tracking-label">Quick Actions</h2>
            <div className="grid gap-4 rounded-control border border-border-subtle p-4 sm:grid-cols-2">
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

          <section className="rounded-control border border-border-subtle p-4">
            <h2 className="mb-2 text-16">Recent Reports</h2>
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
                  <p className="mt-2 text-center">
                    <Link
                      to="/reports"
                      className="inline-flex min-h-11 items-center text-13 text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                    >
                      View All Reports
                    </Link>
                  </p>
                </>
              )}
            </QueryBoundary>
          </section>
        </div>

        <section className="min-w-0">
          <FeedingCalendar
            days={calendar.data ?? []}
            selectedDate={manilaToday()}
            onRangeChange={handleRange}
            onDayClick={() => {
              void navigate("/calendar");
            }}
          />
          <p className="mt-4 text-center">
            <Link
              to="/menu-imports"
              className="inline-flex min-h-11 items-center text-15 font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              Upload Menu Document
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
