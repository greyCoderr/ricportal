import type { UserStatus } from "@ricportal/shared";
import { Badge, type BadgeTone } from "../../../components/ui";

const ACCOUNT_BADGES: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  PENDING: { label: "Waiting for approval", tone: "warning" },
  DECLINED: { label: "Declined", tone: "danger" },
  DISABLED: { label: "Disabled", tone: "danger" },
};

export function AccountStatusBadge({ status }: { status: UserStatus }) {
  const { label, tone } = ACCOUNT_BADGES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
