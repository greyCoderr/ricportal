import type { PurchaseItemDto } from "@ricportal/shared";
import { useState } from "react";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  LedgerTable,
  type LedgerColumn,
} from "../../../components/ui";
import { formatDate, formatMenuName, formatPeso } from "../../../lib/format";
import type { AnyPurchaseRequest, PrAction } from "../api";
import { usePrAction, usePurchaseRequest } from "../hooks";
import { PrStatusBadge } from "./PrStatusBadge";
import { PurchaseItemsTable } from "./PurchaseItemsTable";

const money = (value: string | null) =>
  value === null ? "-" : formatPeso(value);

const CONFIRMS: Partial<
  Record<PrAction, { title: string; label: string; body: string }>
> = {
  lock: {
    title: "Lock this day?",
    label: "Lock day",
    body: "Nobody can change this Purchase Request until you unlock it. The budget is frozen.",
  },
  "no-feeding": {
    title: "Mark this day as No feeding?",
    label: "No feeding",
    body: "This day is left out of the budget and the Summary of Disbursement.",
  },
};

const READ_COLUMNS: LedgerColumn<PurchaseItemDto>[] = [
  {
    key: "no",
    header: "Item No.",
    numeric: true,
    render: (r) => String(r.itemNo),
  },
  { key: "unit", header: "Unit", render: (r) => r.unit ?? "" },
  {
    key: "description",
    header: "Item Description",
    render: (r) => r.description,
  },
  { key: "qty", header: "Qty", numeric: true, render: (r) => r.quantity ?? "" },
  {
    key: "cost",
    header: "Unit Cost",
    numeric: true,
    render: (r) => money(r.unitCost),
  },
  {
    key: "total",
    header: "Total Cost",
    numeric: true,
    render: (r) => money(r.total),
  },
];

function BudgetLine({ pr }: { pr: AnyPurchaseRequest }) {
  if (pr.budget === undefined || pr.ratePerChild === undefined) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1 text-13">
      <p className="tabular-nums">
        Budget {formatPeso(pr.budget)} = {pr.enrolledCount} children x{" "}
        {formatPeso(pr.ratePerChild)}
      </p>
      {pr.isOverBudget === true && (
        <p className="font-medium text-warning-text">
          The sub-total is over the budget.
        </p>
      )}
    </div>
  );
}

function PrHeader({ pr }: { pr: AnyPurchaseRequest }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-16 font-semibold">{formatMenuName(pr.menuName)}</p>
        <p className="text-13 text-text-secondary">PR No. {pr.prNo}</p>
      </div>
      <PrStatusBadge status={pr.status} />
    </div>
  );
}

// Read-only view: the Admin, and the Teacher once a day is locked (P5-T16).
export function PurchaseRequestView({ pr }: { pr: AnyPurchaseRequest }) {
  return (
    <>
      <PrHeader pr={pr} />
      {pr.items.length === 0 ? (
        <EmptyState
          title={`No ingredients listed for ${formatMenuName(pr.menuName)} yet.`}
        />
      ) : (
        <LedgerTable
          caption={`Purchase Request, ${formatDate(pr.date)}`}
          columns={READ_COLUMNS}
          rows={pr.items}
          rowKey={(row) => row.id}
          total={{ label: "Sub-total", value: formatPeso(pr.subtotal) }}
        />
      )}
      <div className="mt-3">
        <BudgetLine pr={pr} />
      </div>
    </>
  );
}

export function AdminPurchaseRequest({
  date,
  centerId,
}: {
  date: string;
  centerId: number;
}) {
  const pr = usePurchaseRequest(date, centerId);
  return (
    <QueryBoundary
      query={pr}
      errorTitle="Could not load this Purchase Request."
    >
      {pr.data !== undefined && <PurchaseRequestView pr={pr.data} />}
    </QueryBoundary>
  );
}

// Purchase Request editor for the Teacher (phase 5, worked example in 4.10).
export function PurchaseRequestEditor({ date }: { date: string }) {
  const pr = usePurchaseRequest(date);
  const action = usePrAction(date);
  const toast = useToast();
  const [confirming, setConfirming] = useState<PrAction | null>(null);
  const data = pr.data;
  const editable = data?.status === "OPEN" || data?.status === "NOT_OPENED";
  const confirm = confirming === null ? undefined : CONFIRMS[confirming];

  function run(next: PrAction) {
    action.mutate(next, {
      onSettled: () => {
        setConfirming(null);
      },
      onError: (error) => {
        toast.show({ kind: "error", message: error.message });
      },
    });
  }

  return (
    <QueryBoundary
      query={pr}
      errorTitle="Could not load this Purchase Request."
    >
      {data !== undefined && (
        <div className="flex flex-col gap-3">
          {editable ? (
            <>
              <PrHeader pr={data} />
              {data.items.length === 0 && (
                <EmptyState title="No ingredients yet. Add the first item." />
              )}
              <PurchaseItemsTable
                date={date}
                items={data.items}
                subtotal={data.subtotal}
                editable
              />
              <BudgetLine pr={data} />
            </>
          ) : (
            <>
              <Banner tone="info">
                {data.status === "LOCKED"
                  ? "This day is locked. Unlock it to make changes."
                  : "This day is marked No feeding. Unlock it to make changes."}
              </Banner>
              <PurchaseRequestView pr={data} />
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {data.status === "OPEN" && (
              <Button
                icon="lock"
                onClick={() => {
                  setConfirming("lock");
                }}
              >
                Lock day
              </Button>
            )}
            {editable && (
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirming("no-feeding");
                }}
              >
                No feeding
              </Button>
            )}
            {!editable && (
              <Button
                variant="secondary"
                icon="lock-open"
                loading={action.isPending}
                onClick={() => {
                  run("unlock");
                }}
              >
                Unlock
              </Button>
            )}
          </div>

          <ConfirmDialog
            open={confirm !== undefined}
            title={confirm?.title ?? ""}
            confirmLabel={confirm?.label ?? "Confirm"}
            loading={action.isPending}
            onCancel={() => {
              setConfirming(null);
            }}
            onConfirm={() => {
              if (confirming !== null) run(confirming);
            }}
          >
            {confirm?.body}
          </ConfirmDialog>
        </div>
      )}
    </QueryBoundary>
  );
}
