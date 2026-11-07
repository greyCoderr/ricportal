import { useId, type ReactNode } from "react";
import { IconButton } from "./Button";
import { useNativeDialog } from "./useNativeDialog";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: OverlayProps & { wide?: boolean }) {
  const ref = useNativeDialog(open, onClose);
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`ric-modal m-auto ${wide ? "ric-modal-wide" : ""} rounded-card bg-surface text-text shadow-panel backdrop:bg-overlay`}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-2">
            <h2 id={titleId} className="text-18 font-semibold">
              {title}
            </h2>
            <IconButton icon="x" label="Close" onClick={onClose} />
          </header>
          <div className="overflow-y-auto p-4">{children}</div>
          {footer !== undefined && (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-border-subtle p-4">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
