import { useId, type ReactNode } from "react";

// What FormField hands to its control: spread it on Input, Select or Textarea.
export type FieldControlProps = {
  id: string;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (field: FieldControlProps) => ReactNode;
};

// Label, control, hint and error (Figma 361:2690; label Medium 15 from
// tokens.md). The hint and the error are linked to the control through
// aria-describedby; an error also sets aria-invalid.
export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [
    hint !== undefined ? hintId : undefined,
    error !== undefined ? errorId : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(" ");

  const field: FieldControlProps = { id };
  if (required) {
    field.required = true;
  }
  if (error !== undefined) {
    field["aria-invalid"] = true;
  }
  if (describedBy !== "") {
    field["aria-describedby"] = describedBy;
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-15 font-medium text-text">
        {label}
        {required && (
          <span aria-hidden="true" className="text-primary">
            {" *"}
          </span>
        )}
      </label>
      {children(field)}
      {hint !== undefined && (
        <p id={hintId} className="text-13 text-text-muted">
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className="text-13 text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
