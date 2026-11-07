import type { UserStatus } from "@ricportal/shared";
import { Icon } from "../../../components/ui";
import { FOCUS_RING, cx } from "../../../components/ui/styles";

// The check button of the Action column (Figma 267:9862, D8): light when active,
// dark when disabled. The word and aria-pressed carry the state, not color alone.
export function StatusToggle({
  name,
  status,
  disabled = false,
  onToggle,
}: {
  name: string;
  status: UserStatus;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const active = status === "ACTIVE";
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${active ? "Disable" : "Enable"} ${name}`}
      title={active ? "Active, click to disable" : "Disabled, click to enable"}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        "inline-flex h-11 items-center gap-1 rounded-control border px-2 text-12 font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-border-subtle bg-accent-soft text-text"
          : "border-nav bg-nav text-nav-text",
        FOCUS_RING,
      )}
    >
      <Icon name="check" size={16} />
      {active ? "Active" : "Disabled"}
    </button>
  );
}
