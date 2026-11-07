import { reviewSchema, type LiquidationDay } from "@ricportal/shared";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { NotFoundPage } from "../../../app/pages/NotFoundPage";
import { TextareaField } from "../../../components/form/fields";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  ConfirmDialog,
  LedgerTable,
  Modal,
  Stamp,
} from "../../../components/ui";
import { ApiError } from "../../../lib/api";
import { formatDate, formatMenuName, formatPeso } from "../../../lib/format";
import { useZodForm } from "../../../lib/use-zod-form";
import { useCurrentUser } from "../../auth/components/guards";
import { PrStatusBadge } from "../../purchase/components/PrStatusBadge";
import { reportFormUrl, reportPurchaseRequestUrl } from "../api";
import { useReport, useReportSnapshot, useReviewReport } from "../hooks";

function openPdf(url: string) {
  window.open(url, "_blank", "noopener");
}

function NeedRevisionForm({
  reportId,
  onClose,
}: {
  reportId: number;
  onClose: () => void;
}) {
  const review = useReviewReport(reportId);
  const form = useZodForm(reviewSchema, {
    decision: "NEED_REVISION",
    feedback: "",
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="Send back for revision"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="revision-form" loading={review.isPending}>
            Need Revision
          </Button>
        </>
      }
    >
      <form
        id="revision-form"
        noValidate
        className="flex flex-col gap-3"
        onSubmit={form.handleSubmit((data) => {
          review.mutate(data, {
            onSuccess: onClose,
            onError: (error) => {
              form.applyError(error);
            },
          });
        })}
      >
        <p className="text-15">
          The days of this period unlock, so the Teacher can fix them and submit
          again.
        </p>
        <TextareaField form={form} name="feedback" label="Feedback" required />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

// Admin detail and review; the Teacher sees the status and feedback. Everything
// shown comes from the snapshot, not live data (P6-T08, P6-T13).
export function ReportDetailPage() {
  const { id } = useParams();
  const reportId = Number(id);
  const user = useCurrentUser();
  const report = useReport(reportId);
  const snapshot = useReportSnapshot(reportId);
  const review = useReviewReport(reportId);
  const toast = useToast();
  const [revising, setRevising] = useState(false);
  const [approving, setApproving] = useState(false);

  if (report.error instanceof ApiError && report.error.status === 404) {
    return <NotFoundPage />;
  }

  const data = report.data;
  const payload = snapshot.data?.payload;
  const lastFeedback = data?.reviews.find(
    (row) => row.decision === "NEED_REVISION",
  );

  return (
    <QueryBoundary query={report} errorTitle="Could not load this report.">
      {data !== undefined && (
        <>
          <p className="mb-2 text-13">
            <Link
              to="/reports"
              className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              Back to reports
            </Link>
          </p>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title={`Liquidation, ${data.centerName}`}
              description={`${data.periodStart} to ${data.periodEnd}. Version ${String(data.currentVersion)}, by ${data.teacherName}.`}
            />
            <Stamp status={data.status} />
          </div>

          {data.status === "NEED_REVISION" && lastFeedback !== undefined && (
            <div className="mb-3">
              <Banner tone="warning" title="Feedback from the Administrator">
                <p className="whitespace-pre-wrap">{lastFeedback.feedback}</p>
                {user.role === "TEACHER" && (
                  <p className="mt-2">
                    Fix the days on the Calendar, lock them, and submit this
                    period again from Liquidation Forms.
                  </p>
                )}
              </Banner>
            </div>
          )}

          <QueryBoundary
            query={snapshot}
            errorTitle="Could not load what was submitted."
          >
            {payload !== undefined && (
              <LedgerTable<LiquidationDay>
                caption="Days in this report"
                rows={payload.days}
                rowKey={(day) => day.date}
                columns={[
                  {
                    key: "date",
                    header: "Date",
                    render: (day) => formatDate(day.date),
                  },
                  {
                    key: "menu",
                    header: "Particular",
                    render: (day) => formatMenuName(day.menuName),
                  },
                  { key: "pr", header: "PR No.", render: (day) => day.prNo },
                  {
                    key: "status",
                    header: "Status",
                    render: (day) => <PrStatusBadge status={day.status} />,
                  },
                  {
                    key: "pdf",
                    header: "PDF",
                    render: (day) =>
                      day.status === "NOT_OPENED" ? (
                        ""
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Purchase Request PDF for ${formatDate(day.date)}`}
                          onClick={() => {
                            openPdf(
                              reportPurchaseRequestUrl(data.id, day.date),
                            );
                          }}
                        >
                          Open
                        </Button>
                      ),
                  },
                  {
                    key: "amount",
                    header: "Total Amount",
                    numeric: true,
                    render: (day) => formatPeso(day.subtotal),
                  },
                ]}
                total={{ label: "TOTAL", value: formatPeso(payload.total) }}
              />
            )}
          </QueryBoundary>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon="download"
              onClick={() => {
                openPdf(reportFormUrl(data.id, "summary"));
              }}
            >
              Summary PDF
            </Button>
            <Button
              variant="secondary"
              icon="download"
              onClick={() => {
                openPdf(reportFormUrl(data.id, "transmittal"));
              }}
            >
              Transmittal PDF
            </Button>
            {user.role === "ADMIN" && data.status === "SUBMITTED" && (
              <>
                <Button
                  onClick={() => {
                    setApproving(true);
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRevising(true);
                  }}
                >
                  Need Revision
                </Button>
              </>
            )}
          </div>

          {revising && (
            <NeedRevisionForm
              reportId={data.id}
              onClose={() => {
                setRevising(false);
              }}
            />
          )}
          <ConfirmDialog
            open={approving}
            title="Approve this report?"
            confirmLabel="Approve"
            loading={review.isPending}
            onCancel={() => {
              setApproving(false);
            }}
            onConfirm={() => {
              review.mutate(
                { decision: "APPROVED" },
                {
                  onSettled: () => {
                    setApproving(false);
                  },
                  onError: (error) => {
                    toast.show({ kind: "error", message: error.message });
                  },
                },
              );
            }}
          >
            Approved is final. The days of this period stay locked.
          </ConfirmDialog>
        </>
      )}
    </QueryBoundary>
  );
}
