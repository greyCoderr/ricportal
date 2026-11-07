import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { TeacherProfilePage } from "./TeacherProfilePage";

const TEACHER = {
  id: 7,
  username: "teacher.sibujo",
  fullName: "Ana Cruz",
  mobile: "09171234567",
  status: "ACTIVE",
  centerId: 1,
  centerName: "Sibujo",
  lastLoginAt: null,
  email: "ana@example.com",
  address: "Purok 2, Sibujo",
  position: null,
  sex: "Female",
  birthDate: "1990-03-14",
  qualification: "BEEd",
  createdAt: "2026-03-01T02:00:00.000Z",
};

type Call = { method: string; path: string; body: unknown };

function mockApi(status = 200) {
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
      let body: unknown = { data: TEACHER, meta: {} };
      if (status !== 200) {
        body = { error: { code: "NOT_FOUND", message: "Gone", details: [] } };
      } else if (path.endsWith("/reset-password")) {
        body = {
          data: { message: "The password was reset to the default." },
          meta: {},
        };
      } else if (path.startsWith("/api/centers")) {
        body = {
          data: [{ id: 1, name: "Sibujo", isActive: true }],
          meta: { page: 1, pageSize: 100, total: 1 },
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
  return calls;
}

function renderPage() {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter initialEntries={["/teachers/7"]}>
        <Routes>
          <Route path="/teachers/:id" element={<TeacherProfilePage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TeacherProfilePage (D8)", () => {
  it("shows the fields of the Profile frame, with real data", async () => {
    mockApi();
    renderPage();
    expect(await screen.findByText("Ana Cruz")).toBeDefined();
    for (const text of [
      "RIC-TCHR-007",
      "Sibujo",
      "ana@example.com",
      "Purok 2, Sibujo",
      "Female",
      "03/14/1990",
      "BEEd",
      "teacher.sibujo",
      "Never",
    ]) {
      expect(screen.getByText(text)).toBeDefined();
    }
  });

  it("reset asks first, then shows only the confirmation", async () => {
    const calls = mockApi();
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Reset to default password" }),
    );
    expect(calls.some((call) => call.path.endsWith("/reset-password"))).toBe(
      false,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reset to default" }),
    );
    expect(
      await screen.findByText(
        "The password was reset to the default. Ana Cruz must change it at the next login.",
      ),
    ).toBeDefined();
    expect(document.body.textContent).not.toContain("RICPortal2026");
  });

  it("cancelling the reset sends nothing", async () => {
    const calls = mockApi();
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Reset to default password" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(calls.some((call) => call.path.endsWith("/reset-password"))).toBe(
      false,
    );
  });

  it("Edit opens the form with the current values", async () => {
    mockApi();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    const name = screen.getByLabelText<HTMLInputElement>(/^Full name/);
    expect(name.value).toBe("Ana Cruz");
  });

  it("the toggle disables through the Admin's PATCH", async () => {
    const calls = mockApi();
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Disable Ana Cruz" }),
    );
    await waitFor(() => {
      expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({
        status: "DISABLED",
      });
    });
  });

  it("shows an error when the profile cannot load", async () => {
    mockApi(404);
    renderPage();
    expect(
      await screen.findByText("Could not load this profile."),
    ).toBeDefined();
  });
});
