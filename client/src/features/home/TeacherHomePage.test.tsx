import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../test/render";

// FullCalendar needs a real browser; Home must not use it (Plan 4 D2).
const { feedingCalendar } = vi.hoisted(() => ({
  feedingCalendar: vi.fn(() => null),
}));
vi.mock("../calendar/components/FeedingCalendar", () => ({
  FeedingCalendar: feedingCalendar,
}));
vi.mock("../auth/components/guards", () => ({
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

const { TeacherHomePage } = await import("./TeacherHomePage");

const REPORT = {
  id: 3,
  centerId: 1,
  centerName: "Sibujo",
  teacherName: "Ana Cruz",
  type: "LIQUIDATION",
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  status: "NEED_REVISION",
  currentVersion: 1,
  total: "450.00",
  submittedAt: "2026-11-06T02:00:00.000Z",
};

const FEEDBACK = {
  reportId: 3,
  reportStatus: "NEED_REVISION",
  feedback: "Please fix the rice.",
  reviewedAt: "2026-11-07T02:00:00.000Z",
};

const student = (id: number) => ({
  id,
  displayName: `Student ${String(id)}`,
  enrolledOn: "2026-06-08",
  age: 3,
});

function mockApi(answers: { reports?: unknown[]; feedback?: unknown[] }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      let rows: unknown[] = [];
      if (path.startsWith("/api/reports/feedback"))
        rows = answers.feedback ?? [];
      else if (path.startsWith("/api/reports")) rows = answers.reports ?? [];
      else if (path.startsWith("/api/students?"))
        rows = [student(1), student(2), student(3), student(4), student(5)];
      const body = path.startsWith("/api/students/summary")
        ? { data: { total: 5, schoolYear: "2026-2027" }, meta: {} }
        : { data: rows, meta: { page: 1, pageSize: 20, total: rows.length } };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
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
        <Route path="/" element={<TeacherHomePage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

function trackingBox() {
  const heading = screen.getByRole("heading", { name: "Report Tracking" });
  if (heading.parentElement === null) throw new Error("no box");
  return within(heading.parentElement);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TeacherHomePage (D10, 175:1023)", () => {
  it("Report Tracking says so when there is no report", async () => {
    mockApi({});
    renderPage();
    expect(await trackingBox().findByText("No report yet.")).toBeDefined();
  });

  it("Report Tracking shows the latest report, its date and status", async () => {
    mockApi({ reports: [REPORT] });
    renderPage();
    const box = trackingBox();
    expect(await box.findByText("Liquidation, 11/01/2026")).toBeDefined();
    expect(box.getByText(/Submitted 11\/06\/2026/)).toBeDefined();
    expect(box.getByText("Need Revision")).toBeDefined();
  });

  it("Plan 4 D2: a mini calendar of day numbers, not FullCalendar", async () => {
    mockApi({});
    renderPage();
    const grid = await screen.findByRole("grid");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
    expect(feedingCalendar).not.toHaveBeenCalled();
  });

  it("Plan 4 D2: a click on a day opens the Calendar at that date", async () => {
    mockApi({});
    renderPage();
    const grid = await screen.findByRole("grid");
    const day = within(grid).getAllByRole("button")[12];
    if (day === undefined) throw new Error("no day");
    const date = day.getAttribute("data-date") ?? "";
    fireEvent.click(day);
    expect(await screen.findByText(`At /calendar?date=${date}`)).toBeDefined();
  });

  it("D8: lists four students, with or without a feedback box", async () => {
    mockApi({ feedback: [FEEDBACK] });
    renderPage();
    expect(await screen.findByText("Please fix the rice.")).toBeDefined();
    expect(
      await screen.findByRole("cell", { name: "Student 4" }),
    ).toBeDefined();
    expect(screen.queryByRole("cell", { name: "Student 5" })).toBe(null);
  });

  it("Plan 4 D7: Recent Reports, then Enrolled Students, under the calendar", async () => {
    mockApi({ reports: [REPORT] });
    renderPage();
    const calendar = await screen.findByRole("grid");
    const recent = screen.getByRole("heading", { name: "Recent Reports" });
    const students = screen.getByRole("heading", {
      name: "Enrolled Students",
    });
    const tracking = screen.getByRole("heading", { name: "Report Tracking" });
    const follows = (a: Node, b: Node) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(follows(calendar, recent)).toBe(true);
    expect(follows(recent, students)).toBe(true);
    expect(follows(tracking, recent)).toBe(true);
    expect(
      screen.getByRole("heading", { name: "Admin Feedback" }),
    ).toBeDefined();
  });

  it("Plan 4 D7: Recent Reports lists the own liquidation reports", async () => {
    mockApi({ reports: [REPORT] });
    renderPage();
    const table = await screen.findByRole("table", { name: "Recent Reports" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Report Type", "Date Submitted", "Status"]);
    expect(within(table).getByText("Liquidation Report")).toBeDefined();
    expect(within(table).getByText("11/06/2026")).toBeDefined();
  });

  it("Plan 4 D8: both tables have the gray header band", async () => {
    mockApi({ reports: [REPORT] });
    renderPage();
    for (const name of ["Recent Reports", "Enrolled Students"]) {
      const table = await screen.findByRole("table", { name });
      const header = table.querySelector("thead tr");
      expect(header?.className).toContain("ric-table-band");
      expect(header?.className).toContain("bg-header");
      expect(table.querySelector("th")?.className).toContain("font-bold");
      expect(table.querySelector("th")?.className).toContain("text-12");
    }
  });

  it("D8: Report Tracking lists only liquidation submissions", async () => {
    mockApi({
      reports: [
        { ...REPORT, id: 4, type: "ENROLLMENT", periodStart: "2026-10-01" },
        REPORT,
      ],
    });
    renderPage();
    await trackingBox().findByText("Liquidation, 11/01/2026");
    expect(trackingBox().queryByText("Liquidation, 10/01/2026")).toBe(null);
  });

  it("D8: an entry already approved offers no Revise and Resubmit", async () => {
    mockApi({ feedback: [{ ...FEEDBACK, reportStatus: "APPROVED" }] });
    renderPage();
    expect(await screen.findByText("Please fix the rice.")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Revise and Resubmit" })).toBe(
      null,
    );
  });
});
