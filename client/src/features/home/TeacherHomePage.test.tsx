import { screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../test/render";

// FullCalendar needs a real browser.
vi.mock("../calendar/components/FeedingCalendar", () => ({
  FeedingCalendar: ({ fit }: { fit?: boolean }) => (
    <p>{fit === true ? "Calendar filling its box" : "Calendar"}</p>
  ),
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

function renderPage() {
  renderWithQuery(
    <MemoryRouter>
      <TeacherHomePage />
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

  it("the calendar fills its box, for a screen that must not scroll (D3)", async () => {
    mockApi({});
    renderPage();
    expect(await screen.findByText("Calendar filling its box")).toBeDefined();
  });

  it("lists four students, or two beside a feedback box so it all fits", async () => {
    mockApi({});
    const first = renderWithQuery(
      <MemoryRouter>
        <TeacherHomePage />
      </MemoryRouter>,
    );
    expect(
      await within(first.container).findByRole("cell", { name: "Student 4" }),
    ).toBeDefined();
    first.unmount();

    mockApi({ feedback: [FEEDBACK] });
    renderPage();
    expect(await screen.findByText("Please fix the rice.")).toBeDefined();
    expect(
      await screen.findByRole("cell", { name: "Student 2" }),
    ).toBeDefined();
    expect(screen.queryByRole("cell", { name: "Student 3" })).toBe(null);
  });
});
