import type { InputHTMLAttributes } from "react";
import { CONTROL, cx } from "./styles";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

// Native input, 44 px high (tokens.md; DEC-028). Pair it with FormField for
// the label, hint and error.
export function Input({ className, disabled, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      disabled={disabled}
      aria-disabled={disabled === true ? true : undefined}
      className={cx(
        CONTROL,
        "h-11 placeholder:text-text-placeholder",
        className,
      )}
    />
  );
}
