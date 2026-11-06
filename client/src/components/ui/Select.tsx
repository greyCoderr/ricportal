import type { SelectHTMLAttributes } from "react";
import { Icon } from "./icons";
import { CONTROL, cx } from "./styles";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  // Text such as "Select..." (Figma 361:2996). It becomes a disabled, hidden
  // empty first option that is selected until the person picks a real one,
  // unless `value` or `defaultValue` is given.
  placeholder?: string;
};

// Native select with the Figma chevron (Lucide chevron-down, 16 px).
export function Select({
  placeholder,
  value,
  defaultValue,
  className,
  disabled,
  children,
  ...rest
}: SelectProps) {
  const startEmpty =
    placeholder !== undefined &&
    value === undefined &&
    defaultValue === undefined;

  return (
    <div className="relative">
      <select
        {...rest}
        value={value}
        defaultValue={startEmpty ? "" : defaultValue}
        disabled={disabled}
        aria-disabled={disabled === true ? true : undefined}
        className={cx(CONTROL, "h-11 appearance-none pr-10", className)}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
