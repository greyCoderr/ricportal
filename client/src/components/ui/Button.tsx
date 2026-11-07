import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { Icon, type IconName } from "./icons";
import { Spinner } from "./Spinner";
import { cx, FOCUS_RING } from "./styles";

// Variants from Figma (docs/components.md): primary is the red button
// (241:1105, 258:5832); secondary is the bordered `Action` (361:2417).
// No green variant (DEC-028). Sizes: sm 32 px, md 44 px (default; Parent
// screens use md).
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, { base: string; hover: string }> = {
  primary: {
    base: "bg-primary text-primary-contrast",
    hover: "hover:bg-primary-hover",
  },
  secondary: {
    base: "border border-border-subtle bg-surface text-text",
    hover: "hover:border-border",
  },
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-11 px-4",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled = false,
  type = "button",
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const style = VARIANT[variant];

  // While loading the button stays focusable (it keeps its place for
  // keyboard users) but ignores clicks and does not submit its form.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-disabled={disabled || loading ? true : undefined}
      aria-busy={loading ? true : undefined}
      onClick={handleClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-control text-13 font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZE[size],
        style.base,
        !loading && !disabled && style.hover,
        loading && "cursor-progress",
        FOCUS_RING,
        className,
      )}
    >
      {loading ? (
        <Spinner />
      ) : (
        icon !== undefined && <Icon name={icon} size={16} />
      )}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> & {
  icon: IconName;
  // The accessible name, also shown below the icon on hover and on keyboard
  // focus (Figma 102:454 shows it on hover; DEC-028 adds focus).
  label: string;
};

// 44 x 44 (DEC-028; Figma draws 45 x 43).
export function IconButton({
  icon,
  label,
  disabled = false,
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-label={label}
      aria-disabled={disabled ? true : undefined}
      className={cx(
        "group relative inline-flex size-11 items-center justify-center rounded-control text-text",
        "disabled:cursor-not-allowed disabled:opacity-50",
        FOCUS_RING,
        className,
      )}
    >
      <Icon name={icon} size={24} />
      <span
        data-icon-label
        aria-hidden="true"
        className="pointer-events-none invisible absolute max-md:hidden top-full left-1/2 -translate-x-1/2 bg-surface px-1 text-15 tracking-label whitespace-nowrap text-text group-hover:visible group-focus-visible:visible"
      >
        {label}
      </span>
    </button>
  );
}
