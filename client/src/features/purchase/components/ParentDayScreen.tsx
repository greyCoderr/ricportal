import { QueryBoundary } from "../../../components/QueryBoundary";
import { Banner } from "../../../components/ui";
import { formatMenuName } from "../../../lib/format";
import { usePurchaseRequest } from "../hooks";
import { PrStatusBadge } from "./PrStatusBadge";
import { PurchaseItemsTable } from "./PurchaseItemsTable";

// S-P5-04 (docs/ui-specs/parent-screens.md), shown for an assigned day. D3: the
// Parent adds, edits and deletes their own rows while the day is open. The Parent
// response never holds the budget (DEC-026), so this screen cannot show it.
export function ParentDayScreen({ date }: { date: string }) {
  const pr = usePurchaseRequest(date);
  const data = pr.data;
  const editable = data?.status === "OPEN" || data?.status === "NOT_OPENED";
  return (
    <QueryBoundary query={pr} errorTitle="Could not load this day.">
      {data !== undefined && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-16 font-semibold">
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
          {data.items.length === 0 && editable && (
            <p className="text-15">
              No ingredients are listed yet. You can add the first one.
            </p>
          )}
          <PurchaseItemsTable
            date={date}
            items={data.items}
            subtotal={data.subtotal}
            editable={editable}
          />
        </div>
      )}
    </QueryBoundary>
  );
}
