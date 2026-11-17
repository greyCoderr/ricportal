import { useState, type ReactNode } from "react";
import type { z } from "zod";
import {
  DateInput,
  FormField,
  IconButton,
  Input,
  Select,
  Textarea,
} from "../../components/ui";
import type { InputSize } from "../../components/ui/Input";

// Field helpers that connect a useZodForm form to the UI kit, so a screen only
// names the field and its label. `form` is typed loosely on purpose: a field
// only reads and writes strings by name.
export type AnyForm = {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  setValue: (name: never, value: never) => void;
  validateField: (name: never) => void;
};

type FieldProps = {
  form: AnyForm;
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
};

function bind(form: AnyForm, name: string) {
  const setValue = form.setValue as (name: string, value: string) => void;
  const validateField = form.validateField as (name: string) => void;
  const value = form.values[name];
  return {
    name,
    value: typeof value === "string" ? value : "",
    onChange: (event: { target: { value: string } }) => {
      setValue(name, event.target.value);
    },
    onBlur: () => {
      validateField(name);
    },
  };
}

export function TextField({
  form,
  name,
  label,
  hint,
  required,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  fieldSize,
}: FieldProps & {
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel";
  fieldSize?: InputSize;
}) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={form.errors[name]}
      required={required}
    >
      {(field) => (
        <Input
          {...field}
          {...bind(form, name)}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          fieldSize={fieldSize}
        />
      )}
    </FormField>
  );
}

// A masked MM/DD/YYYY field; the form keeps YYYY-MM-DD (D7).
export function DateField({ form, name, label, hint, required }: FieldProps) {
  const { value, onChange, onBlur } = bind(form, name);
  return (
    <FormField
      label={label}
      hint={hint}
      error={form.errors[name]}
      required={required}
    >
      {(field) => (
        <DateInput
          {...field}
          name={name}
          value={value}
          onBlur={onBlur}
          onValueChange={(next) => {
            onChange({ target: { value: next } });
          }}
        />
      )}
    </FormField>
  );
}

export function PasswordField({
  form,
  name,
  label,
  hint,
  required,
  autoComplete = "current-password",
  placeholder,
  fieldSize,
}: FieldProps & {
  autoComplete?: string;
  placeholder?: string;
  fieldSize?: InputSize;
}) {
  const [shown, setShown] = useState(false);
  return (
    <FormField
      label={label}
      hint={hint}
      error={form.errors[name]}
      required={required}
    >
      {(field) => (
        <div className="relative">
          <Input
            {...field}
            {...bind(form, name)}
            type={shown ? "text" : "password"}
            autoComplete={autoComplete}
            placeholder={placeholder}
            fieldSize={fieldSize}
            className="pr-12"
          />
          <div className="absolute top-1/2 right-0 -translate-y-1/2">
            <IconButton
              icon="eye"
              label={shown ? `Hide ${label}` : `Show ${label}`}
              onClick={() => {
                setShown((value) => !value);
              }}
            />
          </div>
        </div>
      )}
    </FormField>
  );
}

export function SelectField({
  form,
  name,
  label,
  hint,
  required,
  placeholder,
  disabled,
  children,
}: FieldProps & {
  placeholder?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={form.errors[name]}
      required={required}
    >
      {(field) => (
        <Select
          {...field}
          {...bind(form, name)}
          placeholder={placeholder}
          disabled={disabled}
        >
          {children}
        </Select>
      )}
    </FormField>
  );
}

export function TextareaField({
  form,
  name,
  label,
  hint,
  required,
}: FieldProps) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={form.errors[name]}
      required={required}
    >
      {(field) => <Textarea {...field} {...bind(form, name)} />}
    </FormField>
  );
}

export type SchemaOutput<S extends z.ZodType> = z.output<S>;
