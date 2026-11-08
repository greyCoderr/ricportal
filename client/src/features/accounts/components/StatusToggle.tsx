import type { UserStatus } from "@ricportal/shared";
import { Icon } from "../../../components/ui";
import { FOCUS_RING, cx } from "../../../components/ui/styles";

// The check button of the Action column (Figma 267:9862): light when active,
// dark when disabled. Icon only (Plan 3 D6): the state is carried by
// aria-pressed, the accessible name and the tooltip, not by color alone, and the
// row's Status badge says it in words.
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
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-nav bg-nav text-nav-text",
        FOCUS_RING,
      )}
    >
      <Icon name="check" size={18} />
    </button>
  );
}
