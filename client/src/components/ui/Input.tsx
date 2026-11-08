import type { InputHTMLAttributes } from "react";
import { CONTROL, CONTROL_BOX, cx } from "./styles";

// "login" is the larger field of the Login page (Plan 3 D2, tokens.css).
export type InputSize = "default" | "login";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  fieldSize?: InputSize;
};

const SIZE: Record<InputSize, string> = {
  default: `${CONTROL} h-11`,
  login: `${CONTROL_BOX} h-(--login-field-h) text-(length:--login-field-text)`,
};

// Native input, 44 px high (tokens.md; DEC-028). Pair it with FormField for
// the label, hint and error.
export function Input({
  className,
  disabled,
  fieldSize = "default",
  ...rest
}: InputProps) {
  return (
    <input
      {...rest}
      disabled={disabled}
      aria-disabled={disabled === true ? true : undefined}
      className={cx(
        SIZE[fieldSize],
        "placeholder:text-text-placeholder",
        className,
      )}
    />
  );
}
