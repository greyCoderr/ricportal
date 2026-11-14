import type { ProfileDto, TeacherSummaryDto } from "@ricportal/shared";
import type { ReactNode } from "react";
import { Link } from "react-router";
import avatar from "../../../assets/avatar-placeholder.png";
import { NOT_SET } from "../../../components/ProfileCard";
import {
  EmptyState,
  Icon,
  StatusBadge,
  Table,
  type IconName,
} from "../../../components/ui";
import {
  formatDate,
  formatInstantDate,
  formatInstantTime,
} from "../../../lib/format";

// The Teacher Profile of Figma 88:695 (docs/feedback/figma-teacher-profile.png,
// Plan 4 D9). Admin and Parent keep the Round 3 layout.

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

const REPORT_TYPE: Record<
  TeacherSummaryDto["reports"][number]["type"],
  string
> = {
  LIQUIDATION: "Liquidation Report",
  ENROLLMENT: "Enrollment Report",
  ACCOMPLISHMENT: "Accomplishment Report",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-11 tracking-label text-text-secondary">{label}</dt>
      <dd className="text-13 font-medium tracking-label break-words">
        {value}
      </dd>
    </div>
  );
}

export function TeacherHeaderCard({
  profile,
  teacherCode,
}: {
  profile: ProfileDto;
  teacherCode: string | undefined;
}) {
  return (
    <section
      aria-label={profile.fullName}
      className="grid gap-5 rounded-card border border-border-subtle bg-surface p-5 shadow-card lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="flex min-w-0 items-center gap-5">
        <img
          src={avatar}
          alt=""
          className="size-24 shrink-0 rounded-full bg-header object-cover lg:size-28"
        />
        <div className="min-w-0">
          <p className="text-18 font-bold tracking-label break-words">
            {profile.fullName}
          </p>
          <span className="mt-1 inline-flex rounded-control bg-success-soft px-2 py-0.5 text-11 font-semibold text-success">
            Active Teacher
          </span>
          <ul className="mt-3 flex flex-col gap-1 text-12 tracking-label">
            <li className="break-words">{profile.email ?? NOT_SET}</li>
            <li>{profile.mobile ?? NOT_SET}</li>
            <li className="break-words">{profile.address ?? NOT_SET}</li>
          </ul>
        </div>
      </div>
      <dl className="grid content-center gap-3 border-border-subtle lg:border-l lg:pl-5">
        <Detail label="Teacher ID" value={teacherCode ?? "..."} />
        <Detail
          label="Date Registered"
          value={formatInstantDate(profile.createdAt)}
        />
        <Detail label="Barangay" value={profile.centerName ?? NOT_SET} />
      </dl>
      <dl className="grid content-center gap-3 border-border-subtle lg:border-l lg:pl-5">
        <Detail label="Sex" value={profile.sex ?? NOT_SET} />
        <Detail
          label="BirthDate"
          value={
            profile.birthDate === null ? NOT_SET : formatDate(profile.birthDate)
          }
        />
        <Detail
          label="Qualification"
          value={profile.qualification ?? NOT_SET}
        />
      </dl>
    </section>
  );
}

const TONE = {
  green: { circle: "bg-accent text-primary-contrast", text: "text-accent" },
  yellow: { circle: "bg-warning text-text", text: "text-warning-text" },
  red: { circle: "bg-danger text-primary-contrast", text: "text-danger-text" },
} as const;

function StatCard({
  icon,
  label,
  value,
  to,
  linkLabel,
  tone,
}: {
  icon: IconName;
  label: string;
  value: number | undefined;
  to: string;
  linkLabel: string;
  tone: keyof typeof TONE;
}) {
  return (
    <div
      data-stat
      className="flex min-w-0 items-center gap-3 rounded-card border border-border-subtle bg-surface p-3 shadow-card"
    >
      <span
        className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full ${TONE[tone].circle}`}
      >
        <Icon name={icon} size={28} />
      </span>
      <div className="min-w-0">
        <p className="text-13 font-bold tracking-label">{label}</p>
        <p
          className={`text-24 leading-tight font-bold tabular-nums ${TONE[tone].text}`}
        >
          {value ?? "-"}
        </p>
        <Link
          to={to}
          className={`inline-flex min-h-11 items-center text-12 compact:min-h-0 ${TONE[tone].text} ${FOCUS}`}
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}

export function TeacherStatCards({
  counts,
}: {
  counts: TeacherSummaryDto["counts"] | undefined;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        tone="green"
        icon="users"
        label="Total Enrolled Students"
        value={counts?.enrolledStudents}
        to="/students"
        linkLabel="View all students"
      />
      <StatCard
        tone="green"
        icon="file-text"
        label="Submitted Reports"
        value={counts?.submittedReports}
        to="/reports"
        linkLabel="View all reports"
      />
      <StatCard
        tone="yellow"
        icon="loader-circle"
        label="Pending Reports"
        value={counts?.pendingReports}
        to="/reports"
        linkLabel="For approval"
      />
      <StatCard
        tone="red"
        icon="refresh-cw"
        label="Return for Revision"
        value={counts?.returnedReports}
        to="/admin-feedback"
        linkLabel="Review and Revise"
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-card border border-border-subtle bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-15 font-bold tracking-label">{title}</h2>
      {children}
    </section>
  );
}

// Numbered pages (Plan 4 playbook): the active page has aria-current.
function NumberedPages({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const button = `inline-flex size-11 items-center justify-center rounded-control text-13 compact:size-8 ${FOCUS}`;
  return (
    <nav
      aria-label="Report pages"
      className="mt-3 flex flex-wrap items-center justify-center gap-1"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => {
          onPage(page - 1);
        }}
        className={`${button} disabled:opacity-40`}
      >
        ‹
      </button>
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={`Page ${String(number)}`}
          aria-current={number === page ? "page" : undefined}
          onClick={() => {
            onPage(number);
          }}
          className={`${button} border ${
            number === page
              ? "border-primary bg-nav-selected font-bold"
              : "border-border-subtle"
          }`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => {
          onPage(page + 1);
        }}
        className={`${button} disabled:opacity-40`}
      >
        ›
      </button>
    </nav>
  );
}

export function RecentSubmittedReports({
  reports,
  page,
  pages,
  onPage,
}: {
  reports: TeacherSummaryDto["reports"];
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  return (
    <Panel title="Recent Submitted Reports">
      {reports.length === 0 ? (
        <EmptyState title="No reports submitted yet." />
      ) : (
        <Table
          band
          cardsOnPhone
          caption="Recent Submitted Reports"
          rows={reports}
          rowKey={(row) => row.id}
          columns={[
            { key: "id", header: "Report ID", render: (row) => row.code },
            {
              key: "type",
              header: "Report Type",
              render: (row) => REPORT_TYPE[row.type],
            },
            {
              key: "date",
              header: "Date and Time",
              render: (row) =>
                `${formatInstantDate(row.submittedAt)} ${formatInstantTime(row.submittedAt)}`,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
        />
      )}
      <NumberedPages page={page} pages={pages} onPage={onPage} />
    </Panel>
  );
}

export function RecentStatusActivity({
  activity,
}: {
  activity: TeacherSummaryDto["activity"];
}) {
  return (
    <Panel title="Recent Status Activity">
      {activity.length === 0 ? (
        <EmptyState title="No activity yet." />
      ) : (
        <ol
          aria-label="Recent Status Activity"
          className="flex flex-col border-l-2 border-accent pl-4"
        >
          {activity.map((entry) => (
            <li
              key={`${entry.at}-${entry.text}-${entry.reportCode}`}
              className="relative grid grid-cols-[6.5rem_4.5rem_minmax(0,1fr)] gap-2 py-1.5 text-12 tracking-label"
            >
              <span
                aria-hidden="true"
                className="absolute top-3 -left-[1.3rem] size-2 rounded-full bg-accent"
              />
              <span className="tabular-nums">
                {formatInstantDate(entry.at)}
              </span>
              <span className="tabular-nums text-text-secondary">
                {formatInstantTime(entry.at)}
              </span>
              <span title={`Report ${entry.reportCode}`}>{entry.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
