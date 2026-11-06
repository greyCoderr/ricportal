import type { ItemPatchInput, PurchaseItemDto } from "@ricportal/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";

export const AUTOSAVE_DELAY_MS = 600;

export type RowField = "description" | "unit" | "quantity" | "unitCost";
export type RowValues = Record<RowField, string>;
export type RowSave = (patch: ItemPatchInput) => Promise<PurchaseItemDto>;
export type RowState = "idle" | "saving" | "saved" | "failed" | "conflict";

function toValues(item: PurchaseItemDto): RowValues {
  return {
    description: item.description,
    unit: item.unit ?? "",
    quantity: item.quantity ?? "",
    unitCost: item.unitCost ?? "",
  };
}

const GENERIC_FAILURE = "Could not save. Please try again.";

// Auto-save for one row (phase 5): 600 ms after the last keystroke or on blur;
// one request in flight, and a newer edit waits; the version is sent and updated
// from each response; on 409 the row refreshes with the latest data.
export function useRowAutosave(options: {
  item: PurchaseItemDto;
  save: RowSave;
  onSaved: () => void;
  onStale: () => void;
}) {
  const { item } = options;
  const [values, setValues] = useState<RowValues>(() => toValues(item));
  const [state, setState] = useState<RowState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const version = useRef(item.version);
  const pending = useRef<Partial<RowValues>>({});
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Holds the latest flush, so a finished save can start the waiting one.
  const flushNext = useRef<() => void>(() => undefined);

  const flush = useCallback(() => {
    clearTimer();
    if (inFlight.current || Object.keys(pending.current).length === 0) {
      return;
    }
    const patch = pending.current;
    pending.current = {};
    inFlight.current = true;
    setState("saving");
    setMessage(null);
    latest.current.save({ version: version.current, ...patch }).then(
      (saved) => {
        inFlight.current = false;
        version.current = saved.version;
        latest.current.onSaved();
        if (Object.keys(pending.current).length > 0) {
          flushNext.current();
        } else {
          setState("saved");
        }
      },
      (error: unknown) => {
        inFlight.current = false;
        if (error instanceof ApiError && error.status === 409) {
          // Someone else changed it, or the day was locked: drop our edit.
          pending.current = {};
          setState("conflict");
          setMessage(error.message);
          latest.current.onStale();
          return;
        }
        // Keep the edit, so Retry sends it again.
        pending.current = { ...patch, ...pending.current };
        setState("failed");
        setMessage(
          error instanceof ApiError
            ? (error.details[0]?.message ?? error.message)
            : GENERIC_FAILURE,
        );
      },
    );
  }, [clearTimer]);

  useEffect(() => {
    flushNext.current = flush;
  }, [flush]);

  const setField = useCallback(
    (field: RowField, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      pending.current = { ...pending.current, [field]: value };
      clearTimer();
      timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [clearTimer, flush],
  );

  // A newer row from the server (a refresh or another editor) replaces what is
  // shown, unless this row still has edits of its own.
  useEffect(() => {
    if (
      item.version > version.current &&
      !inFlight.current &&
      Object.keys(pending.current).length === 0
    ) {
      version.current = item.version;
      setValues(toValues(item));
    }
  }, [item]);

  useEffect(() => clearTimer, [clearTimer]);

  // Leaving the page with unsaved rows shows a warning.
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (inFlight.current || Object.keys(pending.current).length > 0) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, []);

  return { values, state, message, setField, flush, retry: flush };
}
