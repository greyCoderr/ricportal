import type { PrDayStatus } from "@ricportal/shared";
import { Badge, type BadgeTone } from "../../../components/ui";

const BADGES: Record<PrDayStatus, { label: string; tone: BadgeTone }> = {
  NOT_OPENED: { label: "No PR", tone: "info" },
  OPEN: { label: "Open", tone: "success" },
  LOCKED: { label: "Locked", tone: "warning" },
  NO_FEEDING: { label: "No feeding", tone: "danger" },
};

export function PrStatusBadge({ status }: { status: PrDayStatus }) {
  const { label, tone } = BADGES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
