import { Badge, type BadgeTone } from "./Badge";

// Labels from BR-07 plus Declined for Parent accounts; tones from the Figma
// badges (DEC-028). The report and account status enums arrive in shared/ in
// Phases 1 and 3; until then the keys are listed here.
export type BadgeStatus =
  "SUBMITTED" | "NEED_REVISION" | "APPROVED" | "DECLINED";

export const STATUS_BADGES: Record<
  BadgeStatus,
  { label: string; tone: BadgeTone }
> = {
  SUBMITTED: { label: "Submitted", tone: "info" },
  NEED_REVISION: { label: "Need Revision", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  DECLINED: { label: "Declined", tone: "danger" },
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const { label, tone } = STATUS_BADGES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
