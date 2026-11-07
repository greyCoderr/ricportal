import { useEffect, useRef } from "react";

// Native dialog with showModal (DEC-028): the browser traps focus, makes the
// page inert and returns focus to the trigger. Escape arrives as the cancel
// event; it is prevented so React state stays in control, and calls onClose.
export function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.hasAttribute("open")) {
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
    } else if (!open && dialog.hasAttribute("open")) {
      dialog.close();
    }
  }, [open]);

  // Most screens remove the dialog instead of closing it. The browser restores
  // focus only on close(), so a dialog removed while open has to do it here.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.hasAttribute("open") === true) {
        opener.current?.focus();
      }
    };
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    function handleCancel(event: Event) {
      event.preventDefault();
      onClose();
    }
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  return ref;
}
