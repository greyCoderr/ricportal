import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";

// FullCalendar needs a real browser; the dashboard must not use it (Plan 4 D2).
const { feedingCalendar } = vi.hoisted(() => ({
  feedingCalendar: vi.fn(() => null),
}));
vi.mock("../../calendar/components/FeedingCalendar", () => ({
  FeedingCalendar: feedingCalendar,
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

function mockApi(
  answers: { summary?: unknown; reports?: unknown[]; days?: unknown[] } = {},
) {
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
      } else if (path.startsWith("/api/calendar")) {
        body = {
          data: answers.days ?? [
            { date: "2026-11-04", menuName: "Pork Nilaga" },
          ],
          meta: {},
        };
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

function Where() {
  const location = useLocation();
  return <p>At {`${location.pathname}${location.search}`}</p>;
}

function renderPage() {
  renderWithQuery(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function cardLabels(): (string | null)[] {
  return screen
    .getAllByText(/./)
    .filter((element) => element.hasAttribute("data-card-label"))
    .map((element) => element.textContent);
}

describe("AdminDashboardPage (Plan 4 D1 to D5)", () => {
  it("shows the real counts with their labels", async () => {
    mockApi();
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Admin Dashboard" }),
    ).toBeDefined();
    for (const [value, label] of [
      ["29", "Registered RIC Teacher"],
      ["432", "Total Enrolled Students"],
      ["5", "Enrollment Reports Submitted"],
      ["7", "Accomplishment Reports Submitted"],
      ["6", "Reports for Revision"],
    ] as const) {
      const card = (await screen.findByText(label, {}, { timeout: 5000 }))
        .parentElement;
      if (card === null) throw new Error(label);
      expect(within(card).getByText(value)).toBeDefined();
    }
  });

  it("D1: five cards in Figma's order, no Reports Submitted and no approved count", async () => {
    mockApi();
    renderPage();
    await screen.findByText("Registered RIC Teacher", {}, { timeout: 5000 });
    expect(cardLabels()).toEqual([
      "Registered RIC Teacher",
      "Total Enrolled Students",
      "Enrollment Reports Submitted",
      "Accomplishment Reports Submitted",
      "Reports for Revision",
    ]);
    expect(screen.queryByText("Reports Submitted")).toBe(null);
    const values = screen
      .getAllByText(/./)
      .filter((element) => element.hasAttribute("data-card-value"))
      .map((element) => element.textContent);
    expect(values).toEqual(["29", "432", "5", "7", "6"]);
  });

  it("D1: the revision card has the red bottom border, the others green", async () => {
    mockApi();
    renderPage();
    const revision = (await screen.findByText("Reports for Revision"))
      .parentElement;
    const teachers = screen.getByText("Registered RIC Teacher").parentElement;
    expect(revision?.className).toContain("border-b-danger");
    expect(teachers?.className).toContain("border-b-accent");
  });

  it("D3: four Quick Actions with Figma's texts and our targets", async () => {
    mockApi();
    renderPage();
    const actions = await screen.findByRole("region", {
      name: "Quick Actions",
    });
    const links = within(actions).getAllByRole("link");
    expect(
      links.map((link) => [
        link.querySelector("[data-action-title]")?.textContent,
        link.getAttribute("href"),
      ]),
    ).toEqual([
      ["Send Feedback", "/reports"],
      ["Monitor Enrolled Students", "/admin/students"],
      ["RIC Teachers", "/teachers"],
      ["View Reports", "/reports"],
    ]);
    expect(
      within(actions).getByText("Review reports and send feedback to teachers"),
    ).toBeDefined();
    expect(
      within(actions).getByText("View and monitor student records by center"),
    ).toBeDefined();
    expect(
      within(actions).getByText("Add teachers and reset their passwords"),
    ).toBeDefined();
    expect(
      within(actions).getByText("Check the liquidation reports"),
    ).toBeDefined();
    expect(links[3]?.className).toContain("bg-warning-soft");
    expect(links[0]?.className).toContain("bg-accent-soft");
    expect(within(actions).queryByText(/Review Applications/)).toBe(null);
  });

  it("D5: Recent Reports lists liquidation reports with a numeric date", async () => {
    mockApi();
    renderPage();
    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Teacher Name", "Report Type", "Date Submitted", "Status"]);
    expect(within(table).getByText("Ana Cruz")).toBeDefined();
    expect(within(table).getByText("11/06/2026")).toBeDefined();
    expect(within(table).getByText("Liquidation Report")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /View All Reports/ })
        .getAttribute("href"),
    ).toBe("/reports");
  });

  it("D5: three tabs; Enrollment and Accomplishment have no reports yet", async () => {
    mockApi();
    renderPage();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Liquidation Reports",
      "Enrollment Reports",
      "Accomplishment Reports",
    ]);
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "Enrollment Reports" }));
    expect(screen.getByText("No reports yet.")).toBeDefined();
    expect(screen.queryByRole("table")).toBe(null);
    fireEvent.click(
      screen.getByRole("tab", { name: "Accomplishment Reports" }),
    );
    expect(screen.getByText("No reports yet.")).toBeDefined();
  });

  it("says so when there are no liquidation reports", async () => {
    mockApi({ reports: [] });
    renderPage();
    expect(
      await screen.findByText(
        "No liquidation reports have been submitted yet.",
      ),
    ).toBeDefined();
  });

  it("D2: a mini calendar of day numbers, no FullCalendar and no dish names", async () => {
    mockApi();
    renderPage();
    const grid = await screen.findByRole("grid");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
    expect(feedingCalendar).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: /has a menu/ }),
    ).toBeDefined();
    expect(screen.queryByText("Pork Nilaga")).toBe(null);
  });

  it("D2: a click on a day opens the Calendar page at that date", async () => {
    mockApi();
    renderPage();
    const grid = await screen.findByRole("grid");
    const day = within(grid).getAllByRole("button")[10];
    if (day === undefined) throw new Error("no day");
    const date = day.getAttribute("data-date") ?? "";
    fireEvent.click(day);
    expect(await screen.findByText(`At /calendar?date=${date}`)).toBeDefined();
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
