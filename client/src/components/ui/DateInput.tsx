import {
  formatNumericDate,
  isCalendarDate,
  maskNumericDate,
  parseNumericDate,
} from "@ricportal/shared";
import type { InputHTMLAttributes } from "react";
import { Input } from "./Input";

type DateInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  // YYYY-MM-DD once the date is complete and real; what was typed until then.
  value: string;
  onValueChange: (value: string) => void;
};

// A masked MM/DD/YYYY text field (D7). The form and the API keep YYYY-MM-DD, so
// an unfinished or impossible date stays as typed and the schema refuses it.
export function DateInput({ value, onValueChange, ...rest }: DateInputProps) {
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="MM/DD/YYYY"
      maxLength={10}
      value={isCalendarDate(value) ? formatNumericDate(value) : value}
      onChange={(event) => {
        const masked = maskNumericDate(event.target.value);
        onValueChange(parseNumericDate(masked) ?? masked);
      }}
    />
  );
}
