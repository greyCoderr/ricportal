import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";

const state = vi.hoisted(() => ({ role: "TEACHER" }));

vi.mock("../../auth/components/guards", () => ({
  useCurrentUser: () => ({
    id: 2,
    role: state.role,
    username: "someone",
    fullName: "Ana Cruz",
    centerId: state.role === "ADMIN" ? null : 1,
    centerName: state.role === "ADMIN" ? null : "Sibujo",
    mustChangePassword: false,
  }),
}));

const { ReportsPage } = await import("./ReportsPage");

function open(role: "TEACHER" | "ADMIN") {
  state.role = role;
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    ),
  );
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// Plan 5 J2: the list heading of each role's frame.
describe("Reports list heading", () => {
  it("the Teacher's Report Status says Recent Submitted Reports (78:284)", async () => {
    open("TEACHER");
    expect(
      await screen.findByRole("heading", { name: "Recent Submitted Reports" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "All Reports List" })).toBe(
      null,
    );
  });

  it("the Admin's Reports keeps All Reports List (268:12661)", async () => {
    open("ADMIN");
    expect(
      await screen.findByRole("heading", { name: "All Reports List" }),
    ).toBeTruthy();
  });
});
