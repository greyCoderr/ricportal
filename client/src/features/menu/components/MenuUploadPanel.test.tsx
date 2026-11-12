import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { MenuUploadPanel } from "./MenuUploadPanel";

const PREVIEW = {
  fileName: "SF MENU for 30 days.xlsx",
  token: "abc",
  batches: [
    {
      sheetName: "PR 1",
      prNo: "2026-01",
      prDate: "2026-11-01",
      periodStart: "2026-11-02",
      periodEnd: "2026-11-30",
      days: 20,
      warnings: [],
    },
  ],
  errors: [],
  overlaps: [],
  warnings: [],
};

function mockApi(previewStatus = 200) {
  const paths: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      paths.push(path);
      let status = 200;
      let body: unknown = { data: { batches: 1, days: 20 }, meta: {} };
      if (path.endsWith("/preview")) {
        status = previewStatus;
        body =
          previewStatus === 200
            ? { data: PREVIEW, meta: {} }
            : {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Some fields are not valid.",
                  details: [],
                },
              };
      }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return paths;
}

function renderPanel() {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter>
        <MenuUploadPanel />
      </MemoryRouter>
    </ToastProvider>,
  );
}

function chooseFile() {
  fireEvent.change(screen.getByLabelText("Choose the DSWD Excel file"), {
    target: {
      files: [new File(["x"], "SF MENU for 30 days.xlsx")],
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MenuUploadPanel (D7)", () => {
  it("is visible with no file, and upload waits for one", () => {
    mockApi();
    renderPanel();
    expect(screen.getByText("Upload Menu/Food Rotation")).toBeDefined();
    const upload = screen.getByRole<HTMLButtonElement>("button", {
      name: "Upload & Process",
    });
    expect(upload.disabled).toBe(true);
  });

  it("links to the import history", () => {
    mockApi();
    renderPanel();
    expect(
      screen
        .getByRole("link", { name: "View import history" })
        .getAttribute("href"),
    ).toBe("/menu-imports");
  });

  it("choose, preview, confirm: nothing is saved before the confirm", async () => {
    const paths = mockApi();
    renderPanel();
    chooseFile();
    expect(screen.getByText("SF MENU for 30 days.xlsx")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Upload & Process" }));
    const dialog = await screen.findByRole("dialog");
    expect(paths.some((path) => path.endsWith("/confirm"))).toBe(false);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm import" }),
    );
    expect(
      await screen.findByText("Imported 20 feeding days from 1 sheet(s)."),
    ).toBeDefined();
    expect(paths.some((path) => path.endsWith("/confirm"))).toBe(true);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBe(null);
    });
    expect(screen.queryByText("Selected File")).toBe(null);
  });

  it("closing the preview confirms nothing and keeps the file", async () => {
    const paths = mockApi();
    renderPanel();
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Upload & Process" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(paths.some((path) => path.endsWith("/confirm"))).toBe(false);
    expect(screen.getByText("Selected File")).toBeDefined();
  });

  it("says plainly when the file is the wrong type", async () => {
    mockApi(400);
    renderPanel();
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Upload & Process" }));
    expect(
      await screen.findByText("Choose an Excel file ending in .xlsx."),
    ).toBeDefined();
  });

  it("Plan 4 D6: the button is the dark green accent, enabled only with a file", () => {
    mockApi();
    renderPanel();
    const upload = screen.getByRole<HTMLButtonElement>("button", {
      name: "Upload & Process",
    });
    expect(upload.className).toContain("bg-accent");
    expect(upload.className).not.toContain("bg-primary");
    chooseFile();
    expect(upload.disabled).toBe(false);
  });

  it("Plan 4 D6: the Selected File chip shows the name, size and a remove x", () => {
    mockApi();
    renderPanel();
    fireEvent.change(screen.getByLabelText("Choose the DSWD Excel file"), {
      target: {
        files: [new File(["x".repeat(1_258_291)], "January 2026 Menu.xlsx")],
      },
    });
    const chip = screen.getByTestId("selected-file");
    expect(within(chip).getByText("January 2026 Menu.xlsx")).toBeDefined();
    expect(within(chip).getByText("1.2 MB")).toBeDefined();
    expect(
      within(chip).getByRole("button", { name: "Remove the file" }),
    ).toBeDefined();
  });

  it("Plan 4 D6: a file that is not .xlsx is refused before any upload", () => {
    const paths = mockApi();
    renderPanel();
    fireEvent.change(screen.getByLabelText("Choose the DSWD Excel file"), {
      target: { files: [new File(["x"], "menu.pdf")] },
    });
    expect(
      screen.getByText("Choose an Excel file ending in .xlsx."),
    ).toBeDefined();
    expect(screen.queryByText("Selected File")).toBe(null);
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Upload & Process",
      }).disabled,
    ).toBe(true);
    expect(paths).toEqual([]);
  });

  it("Plan 4 D6: the texts say .xlsx only", () => {
    mockApi();
    renderPanel();
    expect(screen.getByText(/\.xlsx/)).toBeDefined();
    expect(screen.queryByText(/PDF|DOCX/)).toBe(null);
  });

  it("a removed file clears the choice", () => {
    mockApi();
    renderPanel();
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "Remove the file" }));
    expect(screen.queryByText("Selected File")).toBe(null);
  });
});
