import { useCallback, useState, type FormEvent } from "react";
import type { z } from "zod";
import { ApiError } from "./api";

// Forms use plain state and the shared Zod schemas (DEC-030). Messages appear
// on blur and on submit; server `details` land under the right fields, and any
// other failure becomes `formError`, shown above the submit button.

type Values = Record<string, string | boolean>;

function issuesToErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function useZodForm<S extends z.ZodType, V extends Values>(
  schema: S,
  initial: V,
) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const setValue = useCallback((name: keyof V & string, value: V[keyof V]) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (current[name] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  function validateField(name: keyof V & string): void {
    const result = schema.safeParse(values);
    const message = result.success
      ? undefined
      : issuesToErrors(result.error)[name];
    setErrors((current) => {
      const next = { ...current };
      if (message === undefined) {
        delete next[name];
      } else {
        next[name] = message;
      }
      return next;
    });
  }

  function focusField(name: string | undefined): void {
    if (name !== undefined) {
      document.getElementsByName(name)[0]?.focus();
    }
  }

  function handleSubmit(onValid: (data: z.output<S>) => void) {
    return (event: FormEvent) => {
      event.preventDefault();
      setFormError(null);
      const result = schema.safeParse(values);
      if (!result.success) {
        const found = issuesToErrors(result.error);
        setErrors(found);
        focusField(Object.keys(found)[0]);
        return;
      }
      setErrors({});
      onValid(result.data);
    };
  }

  function applyError(error: unknown): void {
    if (error instanceof ApiError) {
      const fields = error.details.filter(
        (detail): detail is { field: string; message: string } =>
          detail.field !== undefined &&
          detail.field !== "" &&
          detail.field in values,
      );
      if (fields.length > 0) {
        const found: Record<string, string> = {};
        for (const detail of fields) {
          found[detail.field] ??= detail.message;
        }
        setErrors(found);
        focusField(fields[0]?.field);
        return;
      }
      setFormError(error.message);
      return;
    }
    setFormError("Something went wrong. Please try again.");
  }

  return {
    values,
    errors,
    formError,
    setValue,
    validateField,
    handleSubmit,
    applyError,
  };
}

export type ZodForm<V extends Values> = {
  values: V;
  errors: Record<string, string>;
  setValue: (name: keyof V & string, value: V[keyof V]) => void;
  validateField: (name: keyof V & string) => void;
};
