import { z } from "zod";
import { calendarDateSchema } from "./students.js";
import { isCalendarDate, weekdayIndex } from "./dates.js";

// The Unit field reads this list with no API call; the server validates against
// the same list (DEC-026).
export const UNITS = [
  "kg",
  "g",
  "pcs",
  "bottle",
  "pack",
  "can",
  "liter",
  "bundle",
  "tray",
  "other",
] as const;
export type Unit = (typeof UNITS)[number];

export const PR_STATUSES = ["OPEN", "LOCKED", "NO_FEEDING"] as const;
export type PrStatus = (typeof PR_STATUSES)[number];
// A feeding day with no Purchase Request yet.
export type PrDayStatus = PrStatus | "NOT_OPENED";

export const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Enter the ingredient.")
  .max(80, "The ingredient must be at most 80 characters.");

export const itemAddSchema = z.object({ description: descriptionSchema });

// Copy-paste of values with commas is accepted; an empty cell clears the value.
const decimalCell = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    if (value === "" || value === null) return null;
    return typeof value === "string" ? value.replaceAll(",", "").trim() : value;
  }, schema.nullable().optional());

const QUANTITY_MESSAGE = "Quantity must be more than 0, with up to 3 decimals.";
const quantitySchema = z
  .string(QUANTITY_MESSAGE)
  .regex(/^\d{1,7}(\.\d{1,3})?$/, QUANTITY_MESSAGE)
  .refine((value) => Number(value) > 0, QUANTITY_MESSAGE);

const UNIT_COST_MESSAGE =
  "Unit cost must be 0 to 100,000, with up to 2 decimals.";
const unitCostSchema = z
  .string(UNIT_COST_MESSAGE)
  .regex(/^\d{1,6}(\.\d{1,2})?$/, UNIT_COST_MESSAGE)
  .refine((value) => Number(value) <= 100_000, UNIT_COST_MESSAGE);

export const itemPatchSchema = z.object({
  version: z.number("The row version is missing.").int().positive(),
  description: descriptionSchema.optional(),
  unit: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(UNITS, "Choose a unit from the list.").nullable().optional(),
  ),
  quantity: decimalCell(quantitySchema),
  unitCost: decimalCell(unitCostSchema),
});
export type ItemPatchInput = z.input<typeof itemPatchSchema>;

export type PurchaseItemDto = {
  id: number;
  itemNo: number;
  description: string;
  unit: string | null;
  quantity: string | null;
  unitCost: string | null;
  // Computed by the server. Null while the quantity or unit cost is empty.
  total: string | null;
  version: number;
};

// A Parent response never holds the budget fields (DEC-026).
export type PurchaseRequestDto = {
  date: string;
  dayName: string;
  menuName: string;
  prNo: string;
  status: PrDayStatus;
  items: PurchaseItemDto[];
  subtotal: string;
};

export type PurchaseRequestBudget = {
  budget: string;
  enrolledCount: number;
  ratePerChild: string;
  isOverBudget: boolean;
};

export type TeacherPurchaseRequestDto = PurchaseRequestDto &
  PurchaseRequestBudget;

export const prQuerySchema = z.object({
  centerId: z.coerce.number().int().positive().optional(),
});

export const assignmentWeekSchema = z.object({
  week: z
    .string("Give the Monday of the week.")
    .refine(
      (value) => isCalendarDate(value) && weekdayIndex(value) === 1,
      "The week is given by its Monday.",
    ),
});

export const assignmentPutSchema = z.object({
  parentIds: z.array(z.number().int().positive()).max(50),
});

export const scheduleQuerySchema = z.object({
  from: calendarDateSchema,
  to: calendarDateSchema,
});

export type AssignmentDay = {
  date: string;
  dayName: string;
  menuName: string | null;
  status: PrDayStatus;
  parents: { id: number; fullName: string }[];
};

export type ApprovedParent = { id: number; fullName: string };

export type ParentScheduleDay = {
  date: string;
  dayName: string;
  menuName: string;
  status: PrDayStatus;
};
