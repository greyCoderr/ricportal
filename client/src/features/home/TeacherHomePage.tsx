import { manilaToday, type ReportDto } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { QueryBoundary } from "../../components/QueryBoundary";
import {
  EmptyState,
  Icon,
  IconButton,
  StatusBadge,
  Table,
  type IconName,
} from "../../components/ui";
import { formatDate, formatInstantDate } from "../../lib/format";
import { useCurrentUser } from "../auth/components/guards";
import { MiniCalendar } from "../calendar/components/MiniCalendar";
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
    <div className="flex items-center gap-3 rounded-card border border-border-subtle p-3 shadow-panel compact:min-h-32 compact:p-2">
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
      className={`flex items-center gap-3 rounded-control border border-border-subtle p-3 shadow-panel compact:min-h-[7.5rem] compact:p-2 ${LINK_FOCUS}`}
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

const TRACKED_REPORTS = 3;

// The Teacher's latest liquidation submissions (Figma's Report Tracking, D8).
function ReportTracking({ reports }: { reports: ReportDto[] }) {
  const shown = reports
    .filter((report) => report.type === "LIQUIDATION")
    .slice(0, TRACKED_REPORTS);
  return (
    <section className="shrink-0 rounded-control border border-border-subtle p-3 shadow-panel compact:min-h-52 compact:p-2">
      <h2 className="text-13 font-medium">Report Tracking</h2>
      {shown.length === 0 ? (
        <p className="mt-1 text-12">No report yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((report) => (
            <li key={report.id}>
              <p className="mt-1 text-12 font-medium text-accent">
                Liquidation, {formatDate(report.periodStart)}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-12 tabular-nums">
                Submitted {formatInstantDate(report.submittedAt)}
                <StatusBadge status={report.status} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Figma 175:1023 shows three rows in Recent Reports and four in Enrolled Students.
const RECENT_REPORT_ROWS = 3;

// The own liquidation reports, newest first (Plan 4 D7: Figma's Recent
// Reports box returns, columns as frame 175:1023).
function RecentReports({ reports }: { reports: ReportDto[] }) {
  return (
    <section className="min-w-0 rounded-control border border-border-subtle p-3 shadow-panel compact:min-h-52 compact:p-2">
      <div className="mb-2 flex items-center justify-between gap-2 compact:mb-1">
        <h2 className="text-15 font-medium">Recent Reports</h2>
        <Link
          to="/reports"
          className={`inline-flex min-h-11 items-center gap-1 text-13 text-accent underline compact:min-h-6 ${LINK_FOCUS}`}
        >
          View all reports
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      {reports.length === 0 ? (
        <EmptyState title="No reports submitted yet." />
      ) : (
        <Table
          band
          cardsOnPhone
          cardsUntilDesktop
          caption="Recent Reports"
          rows={reports.slice(0, RECENT_REPORT_ROWS)}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "title",
              header: "Report Title",
              render: () => (
                <span className="inline-flex items-center gap-1">
                  <Icon name="file-text" size={16} />
                  Liquidation Report
                </span>
              ),
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
    </section>
  );
}

// Teacher Home (Figma 175:1023, Plan 3 D8) with real data for the own center. It
// follows the rows and proportions of that frame (DEC-053); Recent Reports and Enrolled Students share the last row.
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
  const liquidation =
    reports.data?.data.filter((report) => report.type === "LIQUIDATION") ?? [];
  const latestFeedback =
    feedback.data?.data.find((row) => row.reportStatus === "NEED_REVISION") ??
    feedback.data?.data[0];

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <>
      <div className="flex flex-col">
        <h1 className="text-24 font-semibold tracking-label text-accent lg:text-40">
          Welcome, Teacher {firstName}!
        </h1>
        <p className="mb-4 flex shrink-0 items-center gap-1 compact:mb-8 text-13 tracking-label text-text-secondary">
          <Icon name="map-pin" size={16} />
          {user.centerName ?? ""}, Libmanan, Camarines Sur
        </p>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 compact:gap-x-[4%]">
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

        <div className="mt-6 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] compact:mt-9 compact:gap-0 compact:grid-cols-[375fr_108fr_690fr_73fr_322fr]">
          <div className="flex min-w-0 flex-col gap-3 compact:col-start-1">
            <section className="shrink-0 compact:flex compact:h-full compact:flex-col">
              <h2 className="mb-2 text-20 tracking-label compact:mb-1">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-3 compact:flex-1 compact:justify-between">
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
          </div>
          {/* Plan 4 D2: the small month, numbers only; a day opens the
              Calendar page at that date. */}
          <section
            aria-label="Feeding calendar"
            className="h-[22rem] min-w-0 compact:col-start-3 compact:aspect-[690/523] compact:h-auto compact:self-start"
          >
            <MiniCalendar
              days={calendar.data ?? []}
              today={manilaToday()}
              onRangeChange={handleRange}
              onDayClick={(date) => {
                void navigate(`/calendar?date=${date}`);
              }}
            />
          </section>
          <div className="flex min-w-0 flex-col gap-3 xl:col-span-2 compact:col-span-1 compact:col-start-5 compact:gap-8 compact:pt-13">
            <ReportTracking reports={reports.data?.data ?? []} />
            <section className="shrink-0 rounded-control border border-border-subtle p-3 shadow-panel compact:min-h-52 compact:p-2">
              <h2 className="text-13 font-medium text-danger-text">
                Admin Feedback
              </h2>
              {latestFeedback === undefined ? (
                <p className="mt-1 text-12">No feedback yet.</p>
              ) : (
                <>
                  <div className="mt-1 rounded-control bg-tag-tint p-2 text-13">
                    <p className="font-medium">From: RIC Admin</p>
                    <p className="text-12 tabular-nums">
                      Received on:{" "}
                      {formatInstantDate(latestFeedback.reviewedAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap">
                      {latestFeedback.feedback}
                    </p>
                  </div>
                  {latestFeedback.reportStatus === "NEED_REVISION" && (
                    <Link
                      to="/calendar"
                      className={`mt-2 inline-flex h-11 w-full items-center justify-center rounded-control bg-primary text-13 font-medium text-primary-contrast hover:bg-primary-hover ${LINK_FOCUS}`}
                    >
                      Revise and Resubmit
                    </Link>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Plan 4 D7: frame 175:1023 (read 2026-11-14) puts Recent Reports
          (593 px) and Enrolled Students (759 px) side by side in one row
          after the Quick Actions and calendar row (DEC-053). */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[593fr_759fr_175fr] compact:gap-6">
        <RecentReports reports={liquidation} />
        <section className="min-w-0 rounded-control border border-border-subtle p-3 shadow-panel compact:min-h-52 compact:p-2">
          <div className="mb-2 flex compact:mb-0 items-center justify-between gap-2">
            <h2 className="text-15 font-medium">Enrolled Students</h2>
            <span className="flex items-center gap-3">
              <Link
                to="/students"
                className={`inline-flex min-h-11 items-center gap-1 text-13 text-accent underline compact:min-h-6 ${LINK_FOCUS}`}
              >
                View all
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/students/new"
                className={`inline-flex min-h-11 items-center rounded-control bg-primary px-3 text-13 font-medium text-primary-contrast hover:bg-primary-hover compact:min-h-8 ${LINK_FOCUS}`}
              >
                + Add Student
              </Link>
            </span>
          </div>
          <QueryBoundary
            query={students}
            errorTitle="Could not load the students."
          >
            {(students.data?.data.length ?? 0) === 0 ? (
              <EmptyState title="No students enrolled yet." />
            ) : (
              <Table
                band
                cardsOnPhone
                cardsUntilDesktop
                caption="Enrolled Students"
                rows={students.data?.data.slice(0, 4) ?? []}
                rowKey={(row) => row.id}
                columns={[
                  {
                    key: "number",
                    header: "#",
                    render: (row) =>
                      String((students.data?.data.indexOf(row) ?? 0) + 1),
                  },
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
                  {
                    key: "edit",
                    header: "Actions",
                    align: "right",
                    render: (row) =>
                      row.isEditable ? (
                        <IconButton
                          icon="pencil"
                          label={`Edit ${row.displayName}`}
                          onClick={() => {
                            void navigate(`/students/${String(row.id)}/edit`);
                          }}
                        />
                      ) : null,
                  },
                ]}
              />
            )}
          </QueryBoundary>
        </section>
      </div>
    </>
  );
}
