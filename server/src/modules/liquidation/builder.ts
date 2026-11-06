import type {
  LiquidationData,
  LiquidationDay,
  LiquidationItem,
  Signatories,
} from "@ricportal/shared";
import { fromDbDate } from "../../core/dates.js";
import { lineTotal, money, subtotal } from "../../core/money.js";
import type { LiquidationRepository } from "./liquidation.repository.js";

export type { LiquidationData };

type MenuDays = Awaited<ReturnType<LiquidationRepository["listMenuDays"]>>;
type PurchaseRequests = Awaited<ReturnType<LiquidationRepository["listPrs"]>>;

// One typed structure from the database rows (P6-T02). Money is computed here,
// on the server, with Decimal, and comes out as strings (BR-11, BR-18).
export function buildLiquidationData(input: {
  centerName: string;
  barangay: string | null;
  teacherName: string | null;
  from: string;
  to: string;
  menuDays: MenuDays;
  prs: PurchaseRequests;
  signatories: Signatories;
}): LiquidationData {
  const prByDate = new Map(
    input.prs.map((pr) => [fromDbDate(pr.feedingDate), pr]),
  );

  const dayTotals: ReturnType<typeof subtotal>[] = [];
  const days: LiquidationDay[] = input.menuDays.map((menuDay) => {
    const date = fromDbDate(menuDay.feedingDate);
    const pr = prByDate.get(date);
    const lines = (pr?.items ?? []).map((item) => {
      const total =
        item.quantity === null || item.unitCost === null
          ? null
          : lineTotal(item.quantity, item.unitCost);
      const dto: LiquidationItem = {
        itemNo: item.itemNo,
        unit: item.unit,
        description: item.description,
        quantity: item.quantity === null ? null : item.quantity.toString(),
        unitCost: item.unitCost === null ? null : money(item.unitCost),
        total: total === null ? null : money(total),
      };
      return { dto, total };
    });
    // BR-15: No feeding days count for nothing.
    const counted = pr?.status === "NO_FEEDING" ? [] : lines;
    const daySubtotal = subtotal(
      counted
        .map((line) => line.total)
        .filter((value): value is NonNullable<typeof value> => value !== null),
    );
    dayTotals.push(daySubtotal);
    return {
      date,
      dayName: menuDay.dayName,
      menuName: menuDay.menuName,
      prNo: pr?.prNo ?? menuDay.batch.prNo,
      prDate: fromDbDate(menuDay.batch.prDate),
      status: pr?.status ?? "NOT_OPENED",
      subtotal: money(daySubtotal),
      items: lines.map((line) => line.dto),
    };
  });

  return {
    centerName: input.centerName,
    barangay: input.barangay ?? input.centerName,
    teacherName: input.teacherName ?? "",
    from: input.from,
    to: input.to,
    days,
    total: money(subtotal(dayTotals)),
    blockingDays: days
      .filter((day) => day.status !== "LOCKED" && day.status !== "NO_FEEDING")
      .map((day) => day.date),
    signatories: input.signatories,
  };
}
