import { UNITS, type PurchaseItemDto } from "@ricportal/shared";
import { useState, type FormEvent } from "react";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  LedgerTable,
  Select,
  type LedgerColumn,
} from "../../../components/ui";
import { formatMenuName, formatPeso } from "../../../lib/format";
import type { AnyPurchaseRequest, PrAction } from "../api";
import {
  patchItem,
  useAddItem,
  useDeleteItem,
  usePrAction,
  usePurchaseRequest,
  useRefreshPurchaseRequest,
} from "../hooks";
import { useRowAutosave, type RowField } from "../use-row-autosave";
import { PrStatusBadge } from "./PrStatusBadge";
import { SaveState } from "./SaveState";

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

function EditableRow({
  item,
  date,
  children,
}: {
  item: PurchaseItemDto;
  date: string;
  children: (row: ReturnType<typeof useRowAutosave>) => React.ReactNode;
}) {
  const refresh = useRefreshPurchaseRequest(date);
  const row = useRowAutosave({
    item,
    save: (patch) => patchItem(item.id, patch),
    onSaved: () => {
      void refresh();
    },
    onStale: () => {
      void refresh();
    },
  });
  return children(row);
}

function RowFields({
  item,
  date,
  onDelete,
}: {
  item: PurchaseItemDto;
  date: string;
  onDelete: () => void;
}) {
  return (
    <EditableRow item={item} date={date}>
      {(row) => {
        const bind = (field: RowField) => ({
          value: row.values[field],
          onChange: (event: { target: { value: string } }) => {
            row.setField(field, event.target.value);
          },
          onBlur: row.flush,
        });
        return (
          <div className="grid gap-2 py-1 sm:grid-cols-[7rem_1fr_6rem_8rem_8rem_auto]">
            <Select
              aria-label={`Unit for ${item.description}`}
              {...bind("unit")}
            >
              <option value="">Unit</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
            <Input
              aria-label={`Description of item ${String(item.itemNo)}`}
              {...bind("description")}
            />
            <Input
              aria-label={`Qty for ${item.description}`}
              inputMode="decimal"
              className="text-right tabular-nums"
              {...bind("quantity")}
            />
            <Input
              aria-label={`Unit cost for ${item.description}`}
              inputMode="decimal"
              className="text-right tabular-nums"
              {...bind("unitCost")}
            />
            <p className="self-center text-right text-15 tabular-nums">
              {money(item.total)}
            </p>
            <IconButton
              icon="trash-2"
              label={`Delete ${item.description}`}
              onClick={onDelete}
            />
            <div className="sm:col-span-6">
              <SaveState
                state={row.state}
                message={row.message}
                onRetry={row.retry}
              />
            </div>
          </div>
        );
      }}
    </EditableRow>
  );
}

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
        <p className="text-18 font-semibold">{formatMenuName(pr.menuName)}</p>
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
          caption={`Purchase Request, ${pr.date}`}
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
  const add = useAddItem(date);
  const remove = useDeleteItem(date);
  const toast = useToast();
  const [description, setDescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PrAction | null>(null);
  const [deleting, setDeleting] = useState<PurchaseItemDto | null>(null);
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

  function submitItem(event: FormEvent) {
    event.preventDefault();
    const text = description.trim();
    if (text === "") {
      setAddError("Enter the ingredient.");
      return;
    }
    setAddError(null);
    add.mutate(text, {
      onSuccess: () => {
        setDescription("");
      },
      onError: (error) => {
        setAddError(error.message);
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
              {data.items.length === 0 ? (
                <EmptyState title="No ingredients yet. Add the first item." />
              ) : (
                <ul className="flex flex-col divide-y divide-border-subtle">
                  {data.items.map((item) => (
                    <li key={item.id}>
                      <p className="pt-2 text-12 text-text-secondary">
                        Item {item.itemNo}
                      </p>
                      <RowFields
                        item={item}
                        date={date}
                        onDelete={() => {
                          setDeleting(item);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <form
                noValidate
                onSubmit={submitItem}
                className="flex flex-wrap items-start gap-2"
              >
                <div className="min-w-48 flex-1">
                  <Input
                    aria-label="New ingredient"
                    placeholder="New ingredient, for example Rice"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                    aria-invalid={addError !== null ? true : undefined}
                  />
                  {addError !== null && (
                    <p className="mt-1 text-13 text-danger-text">{addError}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  icon="plus"
                  loading={add.isPending}
                >
                  Add ingredient
                </Button>
              </form>
              <div className="flex justify-between border-t border-b-4 border-double border-t-border border-b-border py-2 font-semibold tabular-nums">
                <span>Sub-total</span>
                <span>{formatPeso(data.subtotal)}</span>
              </div>
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
          <ConfirmDialog
            open={deleting !== null}
            title={`Delete ${deleting?.description ?? "this row"}?`}
            confirmLabel="Delete"
            loading={remove.isPending}
            onCancel={() => {
              setDeleting(null);
            }}
            onConfirm={() => {
              if (deleting === null) return;
              remove.mutate(deleting.id, {
                onSettled: () => {
                  setDeleting(null);
                },
                onError: (error) => {
                  toast.show({ kind: "error", message: error.message });
                },
              });
            }}
          >
            The other rows are renumbered.
          </ConfirmDialog>
        </div>
      )}
    </QueryBoundary>
  );
}
