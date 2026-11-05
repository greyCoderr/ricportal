import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// A small toast provider (no dependency, DEC-021). Messages appear in a polite
// live region and are removed after TOAST_DURATION_MS.

export const TOAST_DURATION_MS = 5000;

export type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };
type ToastApi = { show: (toast: { kind: ToastKind; message: string }) => void };

const ToastContext = createContext<ToastApi | null>(null);

const KIND_CLASSES: Record<ToastKind, string> = {
  success: "border-success bg-success-soft text-text",
  error: "border-danger bg-danger-soft text-danger-text",
  info: "border-border-subtle bg-surface text-text",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) {
        clearTimeout(timer);
      }
      active.clear();
    };
  }, []);

  const show = useCallback<ToastApi["show"]>(({ kind, message }) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, kind, message }]);
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
    timers.current.set(id, timer);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed right-4 bottom-4 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-control border px-3 py-2 shadow-panel ${KIND_CLASSES[toast.kind]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return api;
}
