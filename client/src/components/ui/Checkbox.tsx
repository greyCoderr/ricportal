import type { InputHTMLAttributes } from "react";
import { Icon } from "./icons";
import { cx, FOCUS_RING } from "./styles";

// The check mark is 2px so it reads at 22 px (docs/ui-specs/ui-kit.md).
const CHECK_STROKE = 2;

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

// Native checkbox styled as the Figma choice box (361:2911): 22 px,
// rounded-cell, border-subtle. Checked look is Developer-designed and
// approved (docs/ui-specs/ui-kit.md). The whole row is at least 44 px high
// and clicking the label toggles the box.
export function Checkbox({
  label,
  className,
  disabled,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={cx(
        "inline-flex min-h-11 cursor-pointer items-center gap-3 text-15 text-text",
        disabled === true && "cursor-not-allowed",
        className,
      )}
    >
      <span className="relative inline-flex size-5.5 shrink-0">
        <input
          {...rest}
          type="checkbox"
          disabled={disabled}
          aria-disabled={disabled === true ? true : undefined}
          className={cx(
            "peer size-5.5 shrink-0 cursor-[inherit] appearance-none rounded-cell border border-border-subtle bg-surface",
            "hover:border-border checked:border-primary checked:bg-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-danger-text",
            FOCUS_RING,
          )}
        />
        <Icon
          name="check"
          size={16}
          strokeWidth={CHECK_STROKE}
          className="pointer-events-none absolute inset-0 m-auto hidden text-primary-contrast peer-checked:block peer-disabled:opacity-50"
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
