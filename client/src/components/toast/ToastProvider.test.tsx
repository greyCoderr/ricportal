import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOAST_DURATION_MS, ToastProvider, useToast } from "./ToastProvider";

function Trigger() {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        toast.show({ kind: "success", message: "Saved." });
      }}
    >
      Show
    </button>
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ToastProvider", () => {
  it("shows a message in a polite live region and removes it after 5 seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    const region = screen.getByRole("status", { name: "Notifications" });
    expect(region.getAttribute("aria-live")).toBe("polite");

    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(region.textContent).toContain("Saved.");

    expect(TOAST_DURATION_MS).toBe(5000);
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(region.textContent).not.toContain("Saved.");
  });

  it("throws a clear error when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(
      "useToast must be used inside ToastProvider",
    );
  });
});
