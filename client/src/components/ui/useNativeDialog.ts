import { useEffect, useRef } from "react";

// Native dialog with showModal (DEC-028): the browser traps focus, makes the
// page inert and returns focus to the trigger. Escape arrives as the cancel
// event; it is prevented so React state stays in control, and calls onClose.
export function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.hasAttribute("open")) {
      dialog.showModal();
    } else if (!open && dialog.hasAttribute("open")) {
      dialog.close();
    }
  }, [open]);

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
