import {
  manilaToday,
  monthRange,
  type LiquidationDay,
} from "@ricportal/shared";
import { useState } from "react";
import { Link } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  FormField,
  Input,
  LedgerTable,
  Tabs,
} from "../../../components/ui";
import { formatLongDay, formatMenuName, formatPeso } from "../../../lib/format";
import { PrStatusBadge } from "../../purchase/components/PrStatusBadge";
import { liveFormUrl, livePurchaseRequestUrl } from "../api";
import { useLiquidationPreview, useSubmitLiquidation } from "../hooks";

function openPdf(url: string) {
  window.open(url, "_blank", "noopener");
}

function PurchaseRequestsTab({ days }: { days: LiquidationDay[] }) {
  return (
    <LedgerTable
      caption="Purchase Requests in this period"
      rows={days}
      rowKey={(day) => day.date}
      columns={[
        { key: "date", header: "Date", render: (day) => day.date },
        {
          key: "menu",
          header: "Menu",
          render: (day) => formatMenuName(day.menuName),
        },
        {
          key: "status",
          header: "Status",
          render: (day) => <PrStatusBadge status={day.status} />,
        },
        {
          key: "subtotal",
          header: "Sub-total",
          numeric: true,
          render: (day) => formatPeso(day.subtotal),
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
                aria-label={`Purchase Request PDF for ${day.date}`}
                onClick={() => {
                  openPdf(livePurchaseRequestUrl(day.date));
                }}
              >
                Open
              </Button>
            ),
        },
      ]}
    />
  );
}

function SummaryTab({
  days,
  total,
  from,
  to,
}: {
  days: LiquidationDay[];
  total: string;
  from: string;
  to: string;
}) {
  // BR-15: No feeding days are left out of the Summary.
  const counted = days.filter(
    (day) => day.status !== "NO_FEEDING" && day.status !== "NOT_OPENED",
  );
  return (
    <div className="flex flex-col gap-3">
      <LedgerTable
        caption="Summary of Disbursement"
        rows={counted}
        rowKey={(day) => day.date}
        columns={[
          { key: "date", header: "Date", render: (day) => day.date },
          {
            key: "menu",
            header: "Particular",
            render: (day) => formatMenuName(day.menuName),
          },
          { key: "pr", header: "PR No.", render: (day) => day.prNo },
          {
            key: "amount",
            header: "Total Amount",
            numeric: true,
            render: (day) => formatPeso(day.subtotal),
          },
        ]}
        total={{ label: "TOTAL", value: formatPeso(total) }}
      />
      <div>
        <Button
          variant="secondary"
          icon="download"
          onClick={() => {
            openPdf(liveFormUrl("summary", from, to));
          }}
        >
          Open Summary PDF
        </Button>
      </div>
    </div>
  );
}

function TransmittalTab({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Banner tone="info">
        The Transmittal Checklist layout is pending the official copy. This PDF
        is a placeholder page.
      </Banner>
      <Button
        variant="secondary"
        icon="download"
        onClick={() => {
          openPdf(liveFormUrl("transmittal", from, to));
        }}
      >
        Open Transmittal PDF
      </Button>
    </div>
  );
}

// Liquidation Forms on the calendar page (P6-T11, P6-T12). The period defaults
// to this month (A-11). The Summary of Disbursement table lives here (D5).
export function LiquidationOverlay({
  onClose,
  initialTab,
}: {
  onClose: () => void;
  initialTab?: "requests" | "summary" | "transmittal";
}) {
  const initial = monthRange(manilaToday());
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const preview = useLiquidationPreview(from, to);
  const submit = useSubmitLiquidation();
  const toast = useToast();
  const data = preview.data;
  const blocking = data?.blockingDays ?? [];

  return (
    <Drawer open wide onClose={onClose} title="Liquidation Forms">
      <div className="mb-3 grid gap-3 sm:grid-cols-2 sm:max-w-lg">
        <FormField label="From">
          {(field) => (
            <Input
              {...field}
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
              }}
            />
          )}
        </FormField>
        <FormField label="To">
          {(field) => (
            <Input
              {...field}
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
              }}
            />
          )}
        </FormField>
      </div>
      <QueryBoundary query={preview} errorTitle="Could not load this period.">
        {data !== undefined &&
          (data.days.length === 0 ? (
            <EmptyState title="No feeding days in this period." />
          ) : (
            <div className="flex flex-col gap-4">
              <Tabs
                label="Liquidation Forms"
                initial={initialTab}
                items={[
                  {
                    id: "requests",
                    label: "Purchase Requests",
                    content: <PurchaseRequestsTab days={data.days} />,
                  },
                  {
                    id: "summary",
                    label: "Summary",
                    content: (
                      <SummaryTab
                        days={data.days}
                        total={data.total}
                        from={from}
                        to={to}
                      />
                    ),
                  },
                  {
                    id: "transmittal",
                    label: "Transmittal",
                    content: <TransmittalTab from={from} to={to} />,
                  },
                ]}
              />
              {submittedId !== null && (
                <Banner tone="success" title="Report submitted">
                  The Administrator can now review it.{" "}
                  <Link
                    to={`/reports/${String(submittedId)}`}
                    className="underline"
                  >
                    See the report
                  </Link>
                </Banner>
              )}
              {submitError !== null && (
                <Banner tone="danger">{submitError}</Banner>
              )}
              <div>
                <Button
                  onClick={() => {
                    setSubmitError(null);
                    setConfirming(true);
                  }}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          ))}
      </QueryBoundary>

      <ConfirmDialog
        open={confirming}
        title={
          blocking.length > 0
            ? "These days are not ready"
            : "Submit this report?"
        }
        confirmLabel="Submit Report"
        loading={submit.isPending}
        onCancel={() => {
          setConfirming(false);
        }}
        onConfirm={() => {
          submit.mutate(
            { from, to },
            {
              onSuccess: (report) => {
                setConfirming(false);
                setSubmittedId(report.id);
                toast.show({ kind: "success", message: "Report submitted." });
              },
              onError: (error) => {
                setConfirming(false);
                setSubmitError(error.message);
              },
            },
          );
        }}
      >
        {blocking.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p>
              Lock these days or mark them No feeding first. Submitting now will
              be refused.
            </p>
            <ul className="list-disc pl-5">
              {blocking.map((date) => (
                <li key={date}>{formatLongDay(date)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p>
            You are submitting {formatPeso(data?.total ?? "0.00")} for {from} to{" "}
            {to}. The days stay locked until the Administrator decides.
          </p>
        )}
      </ConfirmDialog>
    </Drawer>
  );
}
