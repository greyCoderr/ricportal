import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { Drawer } from "./Drawer";
import { Modal } from "./Modal";

function dialogOf(container: HTMLElement): HTMLDialogElement {
  const dialog = container.querySelector("dialog");
  if (dialog === null) {
    throw new Error("no dialog rendered");
  }
  return dialog;
}

describe.each([
  ["Modal", Modal],
  ["Drawer", Drawer],
] as const)("%s", (_name, Overlay) => {
  it("is a native dialog that opens and closes with its prop", () => {
    const { container, rerender } = render(
      <Overlay open={false} onClose={() => undefined} title="Add a student">
        Body
      </Overlay>,
    );
    const dialog = dialogOf(container);
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(screen.queryByText("Body")).toBe(null);

    rerender(
      <Overlay open onClose={() => undefined} title="Add a student">
        Body
      </Overlay>,
    );
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(screen.getByText("Body")).toBeDefined();

    rerender(
      <Overlay open={false} onClose={() => undefined} title="Add a student">
        Body
      </Overlay>,
    );
    expect(dialog.hasAttribute("open")).toBe(false);
  });

  it("is labelled by its title", () => {
    const { container } = render(
      <Overlay open onClose={() => undefined} title="Add a student">
        Body
      </Overlay>,
    );
    const dialog = dialogOf(container);
    const heading = screen.getByRole("heading", { name: "Add a student" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("Escape (the cancel event) calls onClose and keeps React in control", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Overlay open onClose={onClose} title="Add a student">
        Body
      </Overlay>,
    );
    const dialog = dialogOf(container);
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("the close button calls onClose", () => {
    const onClose = vi.fn();
    render(
      <Overlay open onClose={onClose} title="Add a student">
        Body
      </Overlay>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses the overlay token for its backdrop", () => {
    const { container } = render(
      <Overlay open onClose={() => undefined} title="Add a student">
        Body
      </Overlay>,
    );
    expect(dialogOf(container).classList).toContain("backdrop:bg-overlay");
  });
});

describe("Drawer", () => {
  it("is a bottom sheet under 768 px and a right panel from md up", () => {
    const { container } = render(
      <Drawer open onClose={() => undefined} title="Tuesday, 10 March 2026">
        Body
      </Drawer>,
    );
    const classes = dialogOf(container).classList;
    for (const name of [
      "mt-auto",
      "w-full",
      "md:ml-auto",
      "md:mt-0",
      "md:h-full",
    ]) {
      expect(classes).toContain(name);
    }
  });
});

describe("ConfirmDialog", () => {
  function setup(loading = false) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const view = render(
      <ConfirmDialog
        open
        title="Lock this day?"
        confirmLabel="Lock day"
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={loading}
      >
        Parents can no longer edit it.
      </ConfirmDialog>,
    );
    return { onConfirm, onCancel, ...view };
  }

  it("confirm uses the primary fill and calls onConfirm", () => {
    const { onConfirm } = setup();
    const confirm = screen.getByRole("button", { name: "Lock day" });
    expect(confirm.classList).toContain("bg-primary");
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel gets focus first and calls onCancel", () => {
    const { onCancel } = setup();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(
      cancel.hasAttribute("autofocus") || document.activeElement === cancel,
    ).toBe(true);
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows busy on confirm while loading", () => {
    const { container, onConfirm } = setup(true);
    const dialog = within(dialogOf(container));
    const confirm = dialog.getByRole("button", { name: "Lock day" });
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
