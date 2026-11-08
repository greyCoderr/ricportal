import { manilaToday, type ReportDto } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { QueryBoundary } from "../../components/QueryBoundary";
import {
  EmptyState,
  Icon,
  StatusBadge,
  Table,
  type IconName,
} from "../../components/ui";
import { formatDate, formatInstantDate } from "../../lib/format";
import { useCurrentUser } from "../auth/components/guards";
import { FeedingCalendar } from "../calendar/components/FeedingCalendar";
import { useCalendar, type DayRange } from "../calendar/hooks";
import { useFeedback, useReports } from "../reports/hooks";
import { useStudents, useStudentSummary } from "../students/hooks";

const LINK_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

function SummaryCard({
  icon,
  label,
  value,
  to,
  linkLabel,
  urgent = false,
}: {
  icon: IconName;
  label: string;
  value: number | undefined;
  to: string;
  linkLabel: string;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border-subtle p-3 shadow-panel compact:p-2">
      <span
        className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full ${
          urgent
            ? "bg-danger-soft text-danger-text"
            : "bg-accent-soft text-accent"
        }`}
      >
        <Icon name={icon} size={28} />
      </span>
      <div className="min-w-0">
        <p className="text-13 font-medium">{label}</p>
        <p
          className={`text-24 font-medium tabular-nums ${urgent ? "text-danger-text" : "text-accent"}`}
        >
          {value ?? "-"}
        </p>
        <Link
          to={to}
          className={`inline-flex min-h-11 items-center text-13 font-light underline ${
            urgent ? "text-danger-text" : "text-accent"
          } ${LINK_FOCUS} lg:min-h-0`}
        >
          {linkLabel}
        </Link>
      </div>
    </div>
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
      className={`flex items-center gap-3 rounded-control border border-border-subtle p-3 shadow-panel compact:p-2 ${LINK_FOCUS}`}
    >
      <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-icon bg-accent-soft text-accent compact:size-10">
        <Icon name={icon} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-15 font-medium tracking-label">
          {title}
        </span>
        <span className="block text-12 font-light">{description}</span>
      </span>
      <span aria-hidden="true" className="text-24">
        ›
      </span>
    </Link>
  );
}

// The latest report, from what the report list holds (Figma's Report Tracking).
function ReportTracking({ report }: { report: ReportDto | undefined }) {
  return (
    <section className="rounded-control border border-border-subtle p-3 shadow-panel compact:p-2">
      <h2 className="text-13 font-medium">Report Tracking</h2>
      {report === undefined ? (
        <p className="mt-1 text-12">No report yet.</p>
      ) : (
        <>
          <p className="mt-1 text-12 font-medium text-accent">
            Liquidation, {formatDate(report.periodStart)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-12 tabular-nums">
            Submitted {formatInstantDate(report.submittedAt)}
            <StatusBadge status={report.status} />
          </p>
        </>
      )}
    </section>
  );
}

// Teacher Home (Figma 175:1023) with real counts for the own center. Figma stacks
// the tables under the calendar; three columns keep the same content on one desktop
// screen with the footer (D3, DEC-046).
export function TeacherHomePage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const firstName = user.fullName.split(" ")[0] ?? user.fullName;
  const summary = useStudentSummary();
  const reports = useReports(1);
  const pending = useReports(1, "SUBMITTED");
  const returned = useReports(1, "NEED_REVISION");
  const feedback = useFeedback(1);
  const students = useStudents({ status: "ACTIVE", page: 1 });
  const [range, setRange] = useState<DayRange | null>(null);
  const calendar = useCalendar(range);
  const latestFeedback = feedback.data?.data.find(
    (row) => row.reportStatus === "NEED_REVISION",
  );

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <div className="flex flex-col compact:h-full compact:min-h-0">
      <h1 className="text-24 font-semibold tracking-label text-accent lg:text-40">
        Welcome, Teacher {firstName}!
      </h1>
      <p className="mb-4 flex shrink-0 items-center gap-1 compact:mb-2 text-13 tracking-label text-text-secondary">
        <Icon name="map-pin" size={16} />
        {user.centerName ?? ""}, Libmanan, Camarines Sur
      </p>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="users"
          label="Total Enrolled Students"
          value={summary.data?.total}
          to="/students"
          linkLabel="View all students"
        />
        <SummaryCard
          icon="file-text"
          label="Submitted Reports"
          value={reports.data?.meta.total}
          to="/reports"
          linkLabel="view all reports"
        />
        <SummaryCard
          icon="loader-circle"
          label="Pending Reports"
          value={pending.data?.meta.total}
          to="/reports"
          linkLabel="For approval"
        />
        <SummaryCard
          urgent
          icon="refresh-cw"
          label="Return for Revision"
          value={returned.data?.meta.total}
          to="/admin-feedback"
          linkLabel="Review and Revise"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] compact:mt-3 compact:min-h-0 compact:flex-1 compact:grid-cols-[18rem_minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3 compact:min-h-0">
          <section className="shrink-0">
            <h2 className="mb-2 text-20 tracking-label compact:mb-1">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3 compact:gap-2">
              <QuickAction
                to="/students/new"
                icon="plus"
                title="Register Students"
                description="Add new students"
              />
              <QuickAction
                to="/submit-report"
                icon="upload"
                title="Submit Report"
                description="Submit a new report for approval"
              />
              <QuickAction
                to="/admin-feedback"
                icon="inbox"
                title="View Feedback"
                description="Check admin feedback and comments"
              />
            </div>
          </section>
          <ReportTracking report={reports.data?.data[0]} />
        </div>
        <section className="min-w-0 compact:min-h-0">
          <FeedingCalendar
            fit
            days={calendar.data ?? []}
            selectedDate={manilaToday()}
            onRangeChange={handleRange}
            onDayClick={() => {
              void navigate("/calendar");
            }}
          />
        </section>
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-2 compact:col-span-1 compact:min-h-0 compact:overflow-y-auto">
          {latestFeedback !== undefined && (
            <section className="shrink-0 rounded-control border border-border-subtle p-3 shadow-panel compact:p-2">
              <h3 className="text-13 font-medium text-danger-text">
                Admin Feedback
              </h3>
              <div className="mt-1 rounded-control bg-tag-tint p-2 text-13">
                <p className="font-medium">From: RIC Admin</p>
                <p className="text-12 tabular-nums">
                  Received on: {formatInstantDate(latestFeedback.reviewedAt)}
                </p>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap">
                  {latestFeedback.feedback}
                </p>
              </div>
              <Link
                to="/calendar"
                className={`mt-2 inline-flex h-11 w-full items-center justify-center rounded-control bg-primary text-13 font-medium text-primary-contrast hover:bg-primary-hover ${LINK_FOCUS}`}
              >
                Revise and Resubmit
              </Link>
            </section>
          )}

          <section className="min-w-0 rounded-control border border-border-subtle p-3 shadow-panel compact:p-2">
            <div className="mb-2 flex compact:mb-0 items-center justify-between gap-2">
              <h2 className="text-15 font-medium">Recent Reports</h2>
              <Link
                to="/reports"
                className={`inline-flex min-h-11 items-center text-13 text-accent underline compact:min-h-6 ${LINK_FOCUS}`}
              >
                View all reports
              </Link>
            </div>
            <QueryBoundary
              query={reports}
              errorTitle="Could not load the reports."
            >
              {(reports.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="No liquidation reports yet." />
              ) : (
                <Table
                  cardsOnPhone
                  cardsUntilDesktop
                  caption="Recent Reports"
                  rows={reports.data?.data.slice(0, 3) ?? []}
                  rowKey={(row) => row.id}
                  columns={[
                    {
                      key: "title",
                      header: "Report Title",
                      render: (row) =>
                        `Liquidation, ${formatDate(row.periodStart)}`,
                    },
                    {
                      key: "date",
                      header: "Date",
                      render: (row) => formatInstantDate(row.submittedAt),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (row) => <StatusBadge status={row.status} />,
                    },
                  ]}
                />
              )}
            </QueryBoundary>
          </section>
          {/* With a feedback box, a desktop screen under 900 px tall has no room
              for this preview; the summary card above links to the students. */}
          <section
            className={`min-w-0 rounded-control border border-border-subtle p-3 shadow-panel compact:p-2 ${
              latestFeedback === undefined
                ? ""
                : "compact:[@media(max-height:899px)]:hidden"
            }`}
          >
            <div className="mb-2 flex compact:mb-0 items-center justify-between gap-2">
              <h2 className="text-15 font-medium">Enrolled Students</h2>
              <Link
                to="/students"
                className={`inline-flex min-h-11 items-center text-13 text-accent underline compact:min-h-6 ${LINK_FOCUS}`}
              >
                View all
              </Link>
            </div>
            <QueryBoundary
              query={students}
              errorTitle="Could not load the students."
            >
              {(students.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="No students enrolled yet." />
              ) : (
                <Table
                  cardsOnPhone
                  cardsUntilDesktop
                  caption="Enrolled Students"
                  rows={
                    students.data?.data.slice(
                      0,
                      latestFeedback === undefined ? 4 : 2,
                    ) ?? []
                  }
                  rowKey={(row) => row.id}
                  columns={[
                    {
                      key: "name",
                      header: "Student name",
                      render: (row) => row.displayName,
                    },
                    {
                      key: "date",
                      header: "Date Enrolled",
                      render: (row) => formatDate(row.enrolledOn),
                    },
                    {
                      key: "age",
                      header: "Age",
                      align: "right",
                      render: (row) => String(row.age),
                    },
                  ]}
                />
              )}
            </QueryBoundary>
          </section>
        </div>
      </div>
    </div>
  );
}
