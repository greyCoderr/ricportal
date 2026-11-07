import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../../lib/query-client";
import { agePreview, StudentForm } from "./StudentForm";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("agePreview", () => {
  it("shows the age for a usual age, with no warning", () => {
    expect(agePreview("2022-11-06", "2026-11-06")).toEqual({
      text: "Age today: 4",
      warning: null,
    });
  });

  it("warns for other ages (A-04)", () => {
    expect(agePreview("2020-01-01", "2026-11-06")?.warning).toContain(
      "Other row",
    );
  });

  it("says when the date is in the future, and is quiet for a bad date", () => {
    expect(agePreview("2026-12-01", "2026-11-06")?.text).toBe(
      "This birthdate is in the future.",
    );
    expect(agePreview("", "2026-11-06")).toBe(null);
    expect(agePreview("2023-02-30", "2026-11-06")).toBe(null);
  });
});

function renderForm(onClose = vi.fn()) {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <StudentForm student={null} onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid() {
  fill(/^Last name/, "Dela Cruz");
  fill(/^First name/, "Maria");
  fireEvent.click(screen.getByLabelText("Female"));
  fill(/^5a\. Date of Birth/, "01/15/2023");
  fill(/^Weight/, "14.50");
  fill(/^Height/, "96.5");
  fill(/^Parent or guardian/, "Rosa Dela Cruz");
}

// The page has about 100 fields, and each getByLabelText scans them all, so the two
// tests that fill the form take 19 to 27 s alone on this machine (POLISH_LOG, F3).
const FILLING_THE_FORM_MS = 120_000;

describe("StudentForm", () => {
  it("shows every required message and sends nothing", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Save Student" }));
    for (const message of [
      "Enter the last name.",
      "Enter the first name.",
      "Choose M or F.",
      "Enter the parent or guardian name.",
    ]) {
      expect(screen.getByText(message)).toBeDefined();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("previews the age while typing", () => {
    renderForm();
    fill(/^5a\. Date of Birth/, "01/01/2020");
    expect(screen.getByRole("alert").textContent).toContain("Other row");
  });

  it(
    "a server duplicate lands under the field and the form stays open",
    async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                error: {
                  code: "CONFLICT",
                  message: "Already listed.",
                  details: [
                    {
                      field: "firstName",
                      message:
                        "A child with this name and birthdate is already listed.",
                    },
                  ],
                },
              }),
              { status: 409, headers: { "Content-Type": "application/json" } },
            ),
          ),
        ),
      );
      const onClose = renderForm();
      fillValid();
      fireEvent.click(screen.getByRole("button", { name: "Save Student" }));
      await screen.findByText(
        "A child with this name and birthdate is already listed.",
        {},
        { timeout: 15_000 },
      );
      expect(onClose).not.toHaveBeenCalled();
    },
    FILLING_THE_FORM_MS,
  );

  it(
    "closes after a successful save",
    async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(JSON.stringify({ data: { id: 1 }, meta: {} }), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        ),
      );
      const onClose = renderForm();
      fillValid();
      fireEvent.click(screen.getByRole("button", { name: "Save Student" }));
      await waitFor(
        () => {
          expect(onClose).toHaveBeenCalledTimes(1);
        },
        { timeout: 15_000 },
      );
    },
    FILLING_THE_FORM_MS,
  );
});
