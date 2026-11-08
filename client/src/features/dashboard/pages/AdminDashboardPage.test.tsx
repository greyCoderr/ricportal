import { screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";

// FullCalendar needs a real browser.
vi.mock("../../calendar/components/FeedingCalendar", () => ({
  FeedingCalendar: () => <p>Calendar</p>,
}));

const { AdminDashboardPage } = await import("./AdminDashboardPage");

const SUMMARY = {
  activeTeachers: 29,
  disabledTeachers: 2,
  centersWithTeacher: 27,
  enrolledStudents: 432,
  reports: { submitted: 18, needRevision: 6, approved: 99 },
  submittedByType: { enrollment: 5, accomplishment: 7 },
};

const REPORT = {
  id: 3,
  centerId: 1,
  centerName: "Sibujo",
  teacherName: "Ana Cruz",
  type: "LIQUIDATION",
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  status: "SUBMITTED",
  currentVersion: 1,
  total: "450.00",
  submittedAt: "2026-11-06T02:00:00.000Z",
};

function mockApi(answers: { summary?: unknown; reports?: unknown[] } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      let status = 200;
      let body: unknown;
      if (path === "/api/dashboard/summary") {
        if (answers.summary === null) {
          status = 500;
          body = { error: { code: "INTERNAL", message: "Down", details: [] } };
        } else {
          body = { data: answers.summary ?? SUMMARY, meta: {} };
        }
      } else {
        const rows = answers.reports ?? [REPORT];
        body = {
          data: rows,
          meta: { page: 1, pageSize: 20, total: rows.length },
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
}

function renderPage() {
  renderWithQuery(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminDashboardPage (D10)", () => {
  it("shows the real counts with their labels", async () => {
    mockApi();
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Admin Dashboard" }),
    ).toBeDefined();
    for (const [value, label] of [
      ["29", "Registered RIC Teacher"],
      ["432", "Total Enrolled Students"],
      ["18", "Reports Submitted"],
      ["5", "Enrollment Reports Submitted"],
      ["7", "Accomplishment Reports Submitted"],
      ["6", "Reports for Revision"],
    ] as const) {
      const card = (await screen.findByText(label)).parentElement;
      if (card === null) throw new Error(label);
      expect(within(card).getByText(value)).toBeDefined();
    }
  });

  it("D6: six cards in the agreed order, and approved reports on none", async () => {
    mockApi();
    renderPage();
    await screen.findByText("Registered RIC Teacher");
    const labels = screen
      .getAllByText(/Teacher$|Students$|Submitted$|Revision$/)
      .filter((element) => element.hasAttribute("data-card-label"))
      .map((element) => element.textContent);
    expect(labels).toEqual([
      "Registered RIC Teacher",
      "Total Enrolled Students",
      "Reports Submitted",
      "Enrollment Reports Submitted",
      "Accomplishment Reports Submitted",
      "Reports for Revision",
    ]);
    expect(screen.queryByText("Reports Approved")).toBe(null);
    expect(screen.queryByText("99")).toBe(null);
  });

  it("keeps Centers and Menu Imports one click away", async () => {
    mockApi();
    renderPage();
    await screen.findByText("Registered RIC Teacher");
    expect(
      screen.getByRole("link", { name: /Centers/ }).getAttribute("href"),
    ).toBe("/centers");
    expect(
      screen.getByRole("link", { name: /Menu Imports/ }).getAttribute("href"),
    ).toBe("/menu-imports");
  });

  it("lists recent reports with a numeric date", async () => {
    mockApi();
    renderPage();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Ana Cruz")).toBeDefined();
    expect(within(table).getByText("11/06/2026")).toBeDefined();
    expect(within(table).getByText("Liquidation, 11/01/2026")).toBeDefined();
  });

  it("says so when there are no reports", async () => {
    mockApi({ reports: [] });
    renderPage();
    expect(
      await screen.findByText(
        "No liquidation reports have been submitted yet.",
      ),
    ).toBeDefined();
  });

  it("offers Retry when the counts fail", async () => {
    mockApi({ summary: null });
    renderPage();
    expect(
      await screen.findByText("Could not load the dashboard counts."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });
});
