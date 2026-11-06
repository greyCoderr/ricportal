import { useId } from "react";
import { IconButton } from "./Button";
import type { OverlayProps } from "./Modal";
import { cx } from "./styles";
import { useNativeDialog } from "./useNativeDialog";

// A bottom sheet under 768 px and a right side panel from md up (S-P5-04).
export function Drawer({
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
      className={cx(
        "m-0 mt-auto max-h-[85vh] w-full max-w-none rounded-t-card bg-surface text-text shadow-panel backdrop:bg-overlay md:mt-0 md:ml-auto md:h-full md:max-h-full md:rounded-none",
        wide ? "md:w-[56rem]" : "md:w-[32rem]",
      )}
    >
      {open && (
        <div className="flex h-full max-h-[85vh] flex-col md:max-h-full">
          <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-2">
            <h2 id={titleId} className="text-18 font-semibold">
              {title}
            </h2>
            <IconButton icon="x" label="Close" onClick={onClose} />
          </header>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
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
