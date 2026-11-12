import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { AdminStudentRecordPage } from "./AdminStudentRecordPage";
import { AdminStudentsPage } from "./AdminStudentsPage";

const CENTERS = [
  { id: 1, name: "Sibujo", teacherCount: 1 },
  { id: 2, name: "Bagumbayan", teacherCount: 1 },
];

const STUDENT = {
  id: 7,
  centerId: 2,
  schoolYear: "2026-2027",
  lastName: "Reyes",
  firstName: "Liza",
  middleName: null,
  displayName: "Reyes, Liza",
  gender: "FEMALE",
  birthdate: "2022-05-01",
  age: 4,
  ageWarning: false,
  weightKg: "14.0",
  heightCm: "98.0",
  parentGuardianName: "Rosa Reyes",
  enrolledOn: "2026-06-15",
  status: "ACTIVE",
  birthOrder: null,
  numberOfSiblings: null,
  religion: null,
  ethnicity: null,
  profileExtra: null,
  isEditable: true,
};

function mockApi() {
  const paths: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      paths.push(path);
      let body: unknown = { data: [], meta: {} };
      if (path.startsWith("/api/centers")) {
        body = {
          data: CENTERS,
          meta: { page: 1, pageSize: 100, total: 2 },
        };
      } else if (path.startsWith("/api/students?")) {
        body = { data: [STUDENT], meta: { page: 1, pageSize: 20, total: 1 } };
      } else if (path === "/api/students/7") {
        body = { data: STUDENT, meta: {} };
      }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return paths;
}

function renderAt(path: string) {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route
            path="/admin/students/:id"
            element={<AdminStudentRecordPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminStudentsPage (Plan 4 D4)", () => {
  it("lists students with Figma's columns, the center name and a numeric date", async () => {
    mockApi();
    renderAt("/admin/students");
    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["#", "Student Name", "Date Enrolled", "Age", "Center"]);
    expect(within(table).getByText("06/15/2026")).toBeDefined();
    expect(await within(table).findByText("Bagumbayan")).toBeDefined();
    expect(
      within(table)
        .getByRole("link", { name: "Reyes, Liza" })
        .getAttribute("href"),
    ).toBe("/admin/students/7");
  });

  it("is read-only: no add, edit or archive", async () => {
    mockApi();
    renderAt("/admin/students");
    await screen.findByRole("table");
    expect(screen.queryByRole("link", { name: /Add/ })).toBe(null);
    expect(screen.queryByRole("button", { name: /Edit|Archive|Add/ })).toBe(
      null,
    );
  });

  it("scopes the list to the chosen center and searches by name", async () => {
    const paths = mockApi();
    renderAt("/admin/students");
    await screen.findByRole("option", { name: "Sibujo" });
    fireEvent.change(screen.getByLabelText("RIC Children Center"), {
      target: { value: "1" },
    });
    await waitFor(() => {
      expect(
        paths.some((path) => /\/api\/students\?.*centerId=1/.test(path)),
      ).toBe(true);
    });
    fireEvent.change(screen.getByLabelText("Search student"), {
      target: { value: "Liza" },
    });
    await waitFor(() => {
      expect(
        paths.some((path) => /\/api\/students\?.*q=Liza.*/.test(path)),
      ).toBe(true);
    });
  });

  it("has a way back to the dashboard", () => {
    mockApi();
    renderAt("/admin/students");
    expect(
      screen
        .getByRole("link", { name: "Back to Dashboard" })
        .getAttribute("href"),
    ).toBe("/");
  });

  it("the record opens read-only, with no add, edit or delete", async () => {
    mockApi();
    renderAt("/admin/students/7");
    expect(
      await screen.findByRole("heading", { name: "Reyes, Liza" }),
    ).toBeDefined();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(
      await screen.findByText("No One-on-One Conferences for Liza yet."),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: /Add|Edit|Delete/ })).toBe(
      null,
    );
    expect(
      screen
        .getByRole("link", { name: "Back to Enrolled Students" })
        .getAttribute("href"),
    ).toBe("/admin/students");
  });
});
