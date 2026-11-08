import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";

vi.mock("../../auth/components/guards", () => ({
  useCurrentUser: () => ({
    id: 2,
    role: "TEACHER",
    username: "teacher.sibujo",
    fullName: "Ana Cruz",
    centerId: 1,
    centerName: "Sibujo",
    mustChangePassword: false,
  }),
}));

const { StudentsPage } = await import("./StudentsPage");

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const body = path.startsWith("/api/students/summary")
        ? { data: { total: 0, schoolYear: "2026-2027" }, meta: {} }
        : { data: [], meta: { page: 1, pageSize: 20, total: 0 } };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openExport() {
  mockApi();
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
  await screen.findByText("Student List for 2026");
  fireEvent.click(screen.getByRole("button", { name: "Export List" }));
  return screen.findByRole("dialog");
}

describe("Export List (D9)", () => {
  it("replaces the Enrollment Form button", async () => {
    await openExport();
    expect(screen.queryByRole("button", { name: "Enrollment Form" })).toBe(
      null,
    );
  });

  it("opens the PDF of the current school year by default", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const dialog = await openExport();
    fireEvent.click(within(dialog).getByRole("button", { name: "Open PDF" }));
    const url = String(open.mock.calls[0]?.[0]);
    expect(url).toContain("/api/enrollment-form.pdf");
    expect(url).toContain("schoolYear=2026-2027");
  });

  it("offers an earlier school year inside the dialog", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const dialog = await openExport();
    const select = within(dialog).getByLabelText(/School Year/);
    const earlier = [...(select as HTMLSelectElement).options][1]?.value ?? "";
    expect(earlier).not.toBe("2026-2027");
    fireEvent.change(select, { target: { value: earlier } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open PDF" }));
    expect(String(open.mock.calls[0]?.[0])).toContain(`schoolYear=${earlier}`);
  });
});
