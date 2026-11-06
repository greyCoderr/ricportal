// Outlined decision stamp for report detail (docs/ui-specs/ui-kit.md,
// DESIGN_LANGUAGE rule 2). Lists use StatusBadge pills, never stamps. The labels
// come from BR-07; the tones from DEC-028. CSS writes it in capitals, so screen
// readers read words.
export type StampStatus = "SUBMITTED" | "NEED_REVISION" | "APPROVED";

const STAMPS: Record<StampStatus, { label: string; classes: string }> = {
  SUBMITTED: {
    label: "Submitted",
    classes: "border-info-text text-info-text",
  },
  NEED_REVISION: {
    label: "Need Revision",
    classes: "border-warning-text text-warning-text",
  },
  APPROVED: { label: "Approved", classes: "border-success text-success" },
};

export function Stamp({ status }: { status: StampStatus }) {
  const { label, classes } = STAMPS[status];
  return (
    <span
      className={`inline-block -rotate-2 rounded-cell border-2 px-3 py-1 text-16 font-semibold tracking-label uppercase ${classes}`}
    >
      {label}
    </span>
  );
}
