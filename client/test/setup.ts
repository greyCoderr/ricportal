import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom has no showModal or close (DEC-028). This test-only stub toggles the
// open attribute and fires close, which is all the jsdom tests rely on. Real
// focus trapping and returning are checked by hand in a real browser.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup();
});
