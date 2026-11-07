import { UNITS, type PurchaseItemDto } from "@ricportal/shared";
import { Fragment, useState, type FormEvent } from "react";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Button,
  ConfirmDialog,
  FormField,
  IconButton,
  Input,
  Select,
} from "../../../components/ui";
import { formatPeso } from "../../../lib/format";
import {
  patchItem,
  useAddItem,
  useDeleteItem,
  useRefreshPurchaseRequest,
} from "../hooks";
import { useRowAutosave } from "../use-row-autosave";
import { SaveState } from "./SaveState";

const CELL = "border-b border-border-subtle px-1 py-2 align-middle";
const HEAD = "border-b border-border px-1 py-2 text-12 font-medium";
const SIDE_RULE = "border-l border-border-subtle";

function ItemEditor({
  item,
  date,
  onDelete,
  onDone,
}: {
  item: PurchaseItemDto;
  date: string;
  onDelete: () => void;
  onDone: () => void;
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
  return (
    <div className="grid gap-3 bg-header p-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormField label={`Description of item ${String(item.itemNo)}`}>
          {(field) => (
            <Input
              {...field}
              value={row.values.description}
              onChange={(event) => {
                row.setField("description", event.target.value);
              }}
              onBlur={row.flush}
            />
          )}
        </FormField>
      </div>
      <FormField label={`Unit for ${item.description}`}>
        {(field) => (
          <Select
            {...field}
            value={row.values.unit}
            onChange={(event) => {
              row.setField("unit", event.target.value);
            }}
            onBlur={row.flush}
          >
            <option value="">Select...</option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      <FormField label={`Qty for ${item.description}`}>
        {(field) => (
          <Input
            {...field}
            inputMode="decimal"
            className="text-right tabular-nums"
            value={row.values.quantity}
            onChange={(event) => {
              row.setField("quantity", event.target.value);
            }}
            onBlur={row.flush}
          />
        )}
      </FormField>
      <FormField label={`Unit cost for ${item.description}`}>
        {(field) => (
          <Input
            {...field}
            inputMode="decimal"
            className="text-right tabular-nums"
            value={row.values.unitCost}
            onChange={(event) => {
              row.setField("unitCost", event.target.value);
            }}
            onBlur={row.flush}
          />
        )}
      </FormField>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <SaveState
          state={row.state}
          message={row.message}
          onRetry={row.retry}
        />
        <div className="ml-auto flex gap-2">
          {item.canDelete && (
            <Button variant="secondary" icon="trash-2" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              row.flush();
              onDone();
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ date }: { date: string }) {
  const add = useAddItem(date);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = description.trim();
    if (text === "") {
      setError("Enter the ingredient.");
      return;
    }
    setError(null);
    add.mutate(text, {
      onSuccess: () => {
        setDescription("");
      },
      onError: (failure) => {
        setError(failure.message);
      },
    });
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="mt-3 flex flex-wrap items-start gap-2"
    >
      <div className="min-w-48 flex-1">
        <Input
          aria-label="New ingredient"
          placeholder="New ingredient, for example Rice"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          aria-invalid={error !== null ? true : undefined}
        />
        {error !== null && (
          <p className="mt-1 text-13 text-danger-text">{error}</p>
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
  );
}

// The Purchase Request table of Figma 393:1133 and 166:1553: Item No., Unit, Item
// Description, Qty and Price (the line total), with a pencil on each row and the
// Total box under it. The pencil opens the row's fields. Shared by the Teacher
// and the Parent; the server decides who may delete (D3).
export function PurchaseItemsTable({
  date,
  items,
  subtotal,
  editable,
}: {
  date: string;
  items: PurchaseItemDto[];
  subtotal: string;
  editable: boolean;
}) {
  const remove = useDeleteItem(date);
  const toast = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<PurchaseItemDto | null>(null);

  return (
    <div>
      {items.length > 0 && (
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Ingredients"
        >
          <table className="w-full min-w-[20rem] border-collapse text-13">
            <thead>
              <tr>
                <th scope="col" className={`${HEAD} w-10 text-left`}>
                  Item No.
                </th>
                <th
                  scope="col"
                  className={`${HEAD} ${SIDE_RULE} w-12 text-left`}
                >
                  Unit
                </th>
                <th scope="col" className={`${HEAD} ${SIDE_RULE} text-left`}>
                  Item Description
                </th>
                <th
                  scope="col"
                  className={`${HEAD} ${SIDE_RULE} w-12 text-right`}
                >
                  Qty
                </th>
                <th
                  scope="col"
                  className={`${HEAD} ${SIDE_RULE} w-24 text-right`}
                >
                  Price
                </th>
                {editable && (
                  <th scope="col" className={`${HEAD} w-11`}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <Fragment key={item.id}>
                  <tr>
                    <td className={`${CELL} tabular-nums`}>{item.itemNo}</td>
                    <td className={`${CELL} ${SIDE_RULE}`}>
                      {item.unit ?? ""}
                    </td>
                    <td className={`${CELL} ${SIDE_RULE} break-words`}>
                      {item.description}
                    </td>
                    <td
                      className={`${CELL} ${SIDE_RULE} text-right tabular-nums`}
                    >
                      {item.quantity ?? ""}
                    </td>
                    <td
                      className={`${CELL} ${SIDE_RULE} text-right tabular-nums`}
                    >
                      {item.total === null ? "-" : formatPeso(item.total)}
                    </td>
                    {editable && (
                      <td className={`${CELL} p-0`}>
                        <IconButton
                          icon="pencil"
                          label={`Edit ${item.description}`}
                          aria-expanded={editingId === item.id}
                          onClick={() => {
                            setEditingId(
                              editingId === item.id ? null : item.id,
                            );
                          }}
                        />
                      </td>
                    )}
                  </tr>
                  {editable && editingId === item.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <ItemEditor
                          item={item}
                          date={date}
                          onDelete={() => {
                            setDeleting(item);
                          }}
                          onDone={() => {
                            setEditingId(null);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editable && <AddItemForm date={date} />}
      <p className="mt-3 flex items-center justify-end gap-3 text-15">
        <span>Total:</span>
        <span className="rounded-control border border-border-subtle px-3 py-2 tabular-nums shadow-panel">
          {formatPeso(subtotal)}
        </span>
      </p>
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
            onSuccess: () => {
              setEditingId(null);
            },
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
  );
}
