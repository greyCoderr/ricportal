import { UNITS, type PurchaseItemDto } from "@ricportal/shared";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Banner, Card, FormField, Input, Select } from "../../../components/ui";
import { formatMenuName, formatPeso } from "../../../lib/format";
import {
  patchItem,
  usePurchaseRequest,
  useRefreshPurchaseRequest,
} from "../hooks";
import { useRowAutosave } from "../use-row-autosave";
import { PrStatusBadge } from "./PrStatusBadge";
import { SaveState } from "./SaveState";

function ParentItemCard({
  item,
  date,
  locked,
}: {
  item: PurchaseItemDto;
  date: string;
  locked: boolean;
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
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-16 font-semibold">{item.description}</p>
        <SaveState
          state={row.state}
          message={row.message}
          onRetry={row.retry}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={`Unit for ${item.description}`}>
          {(field) => (
            <Select
              {...field}
              disabled={locked}
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
              disabled={locked}
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
              disabled={locked}
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
        <div className="flex flex-col justify-end">
          <p className="text-13 text-text-secondary">Total</p>
          <p className="text-16 font-semibold tabular-nums">
            {item.total === null ? "-" : formatPeso(item.total)}
          </p>
        </div>
      </div>
    </Card>
  );
}

// S-P5-04 (docs/ui-specs/parent-screens.md). The Parent response never holds the
// budget (DEC-026), so this screen cannot show it. Roomy, one task on screen.
export function ParentDayScreen({ date }: { date: string }) {
  const pr = usePurchaseRequest(date);
  const data = pr.data;
  const locked = data !== undefined && data.status !== "OPEN";
  return (
    <QueryBoundary query={pr} errorTitle="Could not load this day.">
      {data !== undefined && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-18 font-semibold">
              {formatMenuName(data.menuName)}
            </p>
            <PrStatusBadge status={data.status} />
          </div>
          {data.status === "LOCKED" && (
            <Banner tone="info">
              This day is locked by your teacher. You can view it but not change
              it.
            </Banner>
          )}
          {data.status === "NO_FEEDING" && (
            <Banner tone="info">
              Your teacher marked this day as No feeding.
            </Banner>
          )}
          {data.items.length === 0 ? (
            <p className="text-16">
              Your teacher has not listed the ingredients yet. Check back later.
            </p>
          ) : (
            <>
              <h3 className="text-16 font-semibold">Ingredients to buy</h3>
              <ul className="flex flex-col gap-3">
                {data.items.map((item) => (
                  <li key={item.id}>
                    <ParentItemCard item={item} date={date} locked={locked} />
                  </li>
                ))}
              </ul>
              <p className="flex justify-between text-16 font-semibold tabular-nums">
                <span>Subtotal</span>
                <span>{formatPeso(data.subtotal)}</span>
              </p>
            </>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}
