import { cleanup, configure } from "@testing-library/react";
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

// findBy and waitFor wait up to 5 s instead of 1 s: under load this laptop
// renders a page with its queries in more than a second (DEC-051, like DEC-029).
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
});
