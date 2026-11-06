import type { SelectHTMLAttributes } from "react";
import { Icon } from "./icons";
import { CONTROL, cx } from "./styles";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  // An empty first option such as "Select..." (Figma 361:2996). It cannot be
  // chosen again once a real option is picked.
  placeholder?: string;
};

// Native select with the Figma chevron (Lucide chevron-down, 16 px).
export function Select({
  placeholder,
  className,
  disabled,
  children,
  ...rest
}: SelectProps) {
  return (
    <div className="relative">
      <select
        {...rest}
        disabled={disabled}
        aria-disabled={disabled === true ? true : undefined}
        className={cx(CONTROL, "h-11 appearance-none pr-10", className)}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
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
