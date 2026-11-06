import type { TextareaHTMLAttributes } from "react";
import { CONTROL, cx } from "./styles";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

// Native textarea with the input radius (DEC-028; Figma 361:3381 draws it
// square).
export function Textarea({ className, disabled, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      disabled={disabled}
      aria-disabled={disabled === true ? true : undefined}
      className={cx(
        CONTROL,
        "min-h-24 resize-y py-2 placeholder:text-text-placeholder",
        className,
      )}
    />
  );
}
