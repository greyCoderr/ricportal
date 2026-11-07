import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { teacherCode, TeachersPage } from "./TeachersPage";

const ACTIVE = {
  id: 7,
  username: "teacher.sibujo",
  fullName: "Ana Cruz",
  mobile: "09171234567",
  status: "ACTIVE",
  centerId: 1,
  centerName: "Sibujo",
  lastLoginAt: "2026-11-05T16:30:00.000Z",
};
const DISABLED = {
  ...ACTIVE,
  id: 8,
  username: "teacher.ibid",
  fullName: "Ben Reyes",
  status: "DISABLED",
  lastLoginAt: null,
};

type Call = { method: string; path: string; body: unknown };

function mockApi(rows: object[] = [ACTIVE, DISABLED]) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({
        method,
        path,
        body:
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as unknown)
            : undefined,
      });
      let body: unknown;
      if (path === "/api/dashboard/summary") {
        body = {
          data: {
            activeTeachers: 12,
            disabledTeachers: 3,
            centersWithTeacher: 11,
            enrolledStudents: 0,
            reports: { submitted: 0, needRevision: 0, approved: 0 },
          },
          meta: {},
        };
      } else if (path.startsWith("/api/centers")) {
        body = {
          data: [{ id: 1, name: "Sibujo", isActive: true }],
          meta: { page: 1, pageSize: 100, total: 1 },
        };
      } else if (path.endsWith("/reset-password")) {
        body = {
          data: { message: "The password was reset to the default." },
          meta: {},
        };
      } else if (method === "POST") {
        body = {
          data: { ...ACTIVE, id: 9, fullName: "New Teacher" },
          meta: {},
        };
      } else {
        body = {
          data: rows,
          meta: { page: 1, pageSize: 20, total: rows.length },
        };
      }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: method === "POST" && path === "/api/teachers" ? 201 : 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

function renderPage() {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter>
        <TeachersPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

// jsdom has no CSS, so the table and the phone cards are both present.
function tableRow(name: string) {
  const table = screen.getByRole("table");
  const row = within(table).getByText(name).closest("tr");
  if (row === null) throw new Error(`no row for ${name}`);
  return row;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TeachersPage", () => {
  it("shows the real counts on the Figma cards", async () => {
    mockApi();
    renderPage();
    expect(await screen.findByText("15")).toBeDefined();
    expect(screen.getByText("Total RIC Teachers")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("11")).toBeDefined();
  });

  it("D8: a disabled teacher has a red Disabled badge, a muted row and Enable", async () => {
    mockApi();
    renderPage();
    await screen.findAllByText("Ben Reyes");
    const row = tableRow("Ben Reyes");
    expect(
      within(row)
        .getAllByText("Disabled")
        .some((element) => element.className.includes("text-danger-text")),
    ).toBe(true);
    expect(row.className).toContain("bg-header");
    expect(
      within(row).getByRole("button", { name: "Enable Ben Reyes" }),
    ).toBeDefined();
    const active = tableRow("Ana Cruz");
    expect(active.className).not.toContain("bg-header");
    expect(
      within(active).getByRole("button", { name: "Disable Ana Cruz" }),
    ).toBeDefined();
  });

  it("shows the last login as a numeric Manila date, and Never", async () => {
    mockApi();
    renderPage();
    await screen.findAllByText("Ben Reyes");
    // 16:30 UTC on the 5th is 00:30 on the 6th in Manila.
    expect(within(tableRow("Ana Cruz")).getByText("11/06/2026")).toBeDefined();
    expect(within(tableRow("Ben Reyes")).getByText("Never")).toBeDefined();
  });

  it("D8: the row has View Profile and the toggle, and no Edit or reset", async () => {
    mockApi();
    renderPage();
    await screen.findAllByText("Ana Cruz");
    const row = tableRow("Ana Cruz");
    expect(
      within(row)
        .getByRole("link", { name: "View profile of Ana Cruz" })
        .getAttribute("href"),
    ).toBe("/teachers/7");
    expect(within(row).queryByRole("button", { name: /^Edit/ })).toBe(null);
    expect(within(row).queryByRole("button", { name: /^Reset/ })).toBe(null);
  });

  it("D8: the toggle shows its state in words, in aria-pressed and in a tooltip", async () => {
    mockApi();
    renderPage();
    await screen.findAllByText("Ana Cruz");
    const on = within(tableRow("Ana Cruz")).getByRole("button", {
      name: "Disable Ana Cruz",
    });
    expect(on.getAttribute("aria-pressed")).toBe("true");
    expect(on.getAttribute("title")).toBe("Active, click to disable");
    expect(on.textContent).toBe("Active");
    expect(on.className).toContain("bg-accent-soft");
    const off = within(tableRow("Ben Reyes")).getByRole("button", {
      name: "Enable Ben Reyes",
    });
    expect(off.getAttribute("aria-pressed")).toBe("false");
    expect(off.getAttribute("title")).toBe("Disabled, click to enable");
    expect(off.textContent).toBe("Disabled");
    expect(off.className).toContain("bg-nav");
  });

  it("D8: the toggle sends the opposite status, in both directions", async () => {
    const calls = mockApi();
    renderPage();
    await screen.findAllByText("Ana Cruz");
    fireEvent.click(
      within(tableRow("Ana Cruz")).getByRole("button", {
        name: "Disable Ana Cruz",
      }),
    );
    fireEvent.click(
      within(tableRow("Ben Reyes")).getByRole("button", {
        name: "Enable Ben Reyes",
      }),
    );
    await waitFor(() => {
      const patches = calls.filter((call) => call.method === "PATCH");
      expect(patches.map((call) => [call.path, call.body])).toEqual([
        ["/api/teachers/7", { status: "DISABLED" }],
        ["/api/teachers/8", { status: "ACTIVE" }],
      ]);
    });
  });

  it("the password is optional on a new account, and blank is sent as blank", async () => {
    const calls = mockApi();
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Add New Teacher" }),
    );
    fireEvent.change(screen.getByLabelText(/^Full name/), {
      target: { value: "New Teacher" },
    });
    fireEvent.change(screen.getByLabelText(/^Username/), {
      target: { value: "new.teacher" },
    });
    const center =
      screen.getByLabelText<HTMLSelectElement>(/^RIC Children Center/);
    await within(center).findByRole("option", { name: "Sibujo" });
    fireEvent.change(center, { target: { value: "1" } });
    const password = screen.getByLabelText<HTMLInputElement>(/^Password/, {
      selector: "input",
    });
    expect(password.required).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => {
      expect(
        calls.some(
          (call) => call.method === "POST" && call.path === "/api/teachers",
        ),
      ).toBe(true);
    });
    expect(
      await screen.findByText(
        "New Teacher can now log in and must choose a new password.",
      ),
    ).toBeDefined();
  });

  it("filters go to the server, and Clear Filters resets them", async () => {
    const calls = mockApi();
    renderPage();
    await screen.findAllByText("Ana Cruz");
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "DISABLED" },
    });
    await waitFor(() => {
      expect(calls.some((call) => call.path.includes("status=DISABLED"))).toBe(
        true,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByLabelText<HTMLSelectElement>("Status").value).toBe("");
  });

  it("an empty filtered list says how to get back", async () => {
    mockApi([]);
    renderPage();
    await screen.findByText("No RIC Teachers yet.");
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "zzz" },
    });
    expect(
      await screen.findByText("No RIC Teacher matches these filters."),
    ).toBeDefined();
  });

  it("builds the display code from the id", () => {
    expect(teacherCode(7)).toBe("RIC-TCHR-007");
  });
});
