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
import { Icon } from "../ui/icons";
import { MESSAGE_BOX, MESSAGE_TONES, type MessageTone } from "../ui/tones";

// A small toast provider (no dependency, DEC-021). Messages appear in a polite
// live region and are removed after TOAST_DURATION_MS.

export const TOAST_DURATION_MS = 5000;

export type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };
type ToastApi = { show: (toast: { kind: ToastKind; message: string }) => void };

const ToastContext = createContext<ToastApi | null>(null);

// Toasts look like Banner (docs/ui-specs/ui-kit.md): the same tone styles and
// icons. The API keeps its three kinds; error uses the danger tone.
const KIND_TONE: Record<ToastKind, MessageTone> = {
  success: "success",
  error: "danger",
  info: "info",
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
        {toasts.map((toast) => {
          const tone = MESSAGE_TONES[KIND_TONE[toast.kind]];
          return (
            <div
              key={toast.id}
              data-toast
              className={`flex gap-3 shadow-panel ${MESSAGE_BOX} ${tone.classes}`}
            >
              <Icon name={tone.icon} className="mt-0.5 shrink-0" />
              <p>{toast.message}</p>
            </div>
          );
        })}
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
