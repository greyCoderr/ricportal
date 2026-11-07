import type { ReportStatus } from "@ricportal/shared";
import { Link } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Banner, Icon, StatusBadge } from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { useReport } from "../hooks";

const LINK =
  "inline-flex h-11 items-center justify-center gap-2 rounded-control px-4 text-13 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

type Step = { label: string; state: "done" | "current" | "todo" };

// The steps follow BR-07. Figma's Pending and For Approval are not agreed statuses
// (DEC-028), so a returned report shows Need Revision in the middle.
export function reportSteps(status: ReportStatus): Step[] {
  if (status === "APPROVED") {
    return [
      { label: "Submitted", state: "done" },
      { label: "Approved", state: "current" },
    ];
  }
  if (status === "NEED_REVISION") {
    return [
      { label: "Submitted", state: "done" },
      { label: "Need Revision", state: "current" },
      { label: "Approved", state: "todo" },
    ];
  }
  return [
    { label: "Submitted", state: "current" },
    { label: "Approved", state: "todo" },
  ];
}

function Steps({ status }: { status: ReportStatus }) {
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-2">
      {reportSteps(status).map((step) => (
        <li
          key={step.label}
          aria-current={step.state === "current" ? "step" : undefined}
          className={`flex items-center gap-1 text-13 ${
            step.state === "todo" ? "text-text-muted" : "font-medium"
          }`}
        >
          {step.state === "done" ? (
            <Icon name="circle-check" size={18} className="text-accent" />
          ) : (
            <span
              aria-hidden="true"
              className={`inline-block size-4 rounded-full border-2 ${
                step.state === "current"
                  ? "border-primary bg-primary"
                  : "border-border-subtle"
              }`}
            />
          )}
          {step.label}
        </li>
      ))}
    </ol>
  );
}

// Selected Report Details (Figma 78:284).
export function SelectedReportDetails({ reportId }: { reportId: number }) {
  const report = useReport(reportId);
  const data = report.data;
  const feedback = data?.reviews.find(
    (row) => row.decision === "NEED_REVISION",
  )?.feedback;
  return (
    <section className="rounded-control border border-border-subtle p-4 shadow-panel">
      <h2 className="mb-2 text-15 font-semibold">Selected Report Details</h2>
      <QueryBoundary query={report} errorTitle="Could not load this report.">
        {data !== undefined && (
          <div className="flex flex-col gap-3">
            <p className="text-18 font-semibold tabular-nums">
              {formatDate(data.periodStart)} to {formatDate(data.periodEnd)}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-13">
              <div>
                <dt className="text-text-secondary">Report Type</dt>
                <dd>Liquidation</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Date Submitted</dt>
                <dd className="tabular-nums">
                  {formatInstantDate(data.submittedAt)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-secondary">Current Status</dt>
                <dd>
                  <StatusBadge status={data.status} />
                </dd>
              </div>
            </dl>
            <Steps status={data.status} />
            {data.status === "NEED_REVISION" &&
              feedback !== undefined &&
              feedback !== null && (
                <Banner tone="warning" title="Admin Feedback">
                  <p className="whitespace-pre-wrap">{feedback}</p>
                </Banner>
              )}
            <div className="flex flex-wrap gap-2">
              {data.status === "NEED_REVISION" && (
                <Link
                  to="/calendar"
                  className={`${LINK} bg-primary text-primary-contrast hover:bg-primary-hover`}
                >
                  Revise Report
                </Link>
              )}
              <Link
                to={`/reports/${String(data.id)}`}
                className={`${LINK} border border-border-subtle hover:border-border`}
              >
                View Full Report
              </Link>
            </div>
          </div>
        )}
      </QueryBoundary>
    </section>
  );
}
