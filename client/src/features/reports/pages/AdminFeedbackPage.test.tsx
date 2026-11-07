import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { reportSteps } from "../components/SelectedReportDetails";
import { AdminFeedbackPage } from "./AdminFeedbackPage";

const FIRST = {
  id: 1,
  reportId: 10,
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  versionNo: 2,
  feedback: "Please fix the rice.",
  reviewedAt: "2026-11-06T02:00:00.000Z",
  reportStatus: "NEED_REVISION",
};
const SECOND = {
  ...FIRST,
  id: 2,
  reportId: 9,
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  versionNo: 1,
  feedback: "The oil is wrong.",
  reportStatus: "APPROVED",
};

function mockApi(rows: object[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const list = path.startsWith("/api/reports/feedback") ? rows : [FIRST];
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: list,
            meta: { page: 1, pageSize: 20, total: list.length },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }),
  );
}

function renderPage() {
  renderWithQuery(
    <MemoryRouter>
      <AdminFeedbackPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminFeedbackPage (D10)", () => {
  it("shows the newest feedback first, with a way to revise it", async () => {
    mockApi([FIRST, SECOND]);
    renderPage();
    expect(await screen.findByText("Please fix the rice.")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Revise Report" }).getAttribute("href"),
    ).toBe("/calendar");
    expect(
      screen
        .getByRole("link", { name: "View Full Report" })
        .getAttribute("href"),
    ).toBe("/reports/10");
  });

  it("shows another record when chosen; a settled report cannot be revised", async () => {
    mockApi([FIRST, SECOND]);
    renderPage();
    await screen.findByText("Please fix the rice.");
    const table = screen.getByRole("table");
    fireEvent.click(
      within(table).getByRole("button", {
        name: "Show the feedback of 10/01/2026 to 10/31/2026, version 1",
      }),
    );
    expect(screen.getByText("The oil is wrong.")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Revise Report" })).toBe(null);
  });

  it("uses numeric dates", async () => {
    mockApi([FIRST]);
    renderPage();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("11/01/2026 to 11/30/2026")).toBeDefined();
    expect(within(table).getByText("11/06/2026")).toBeDefined();
  });

  it("says so when there is no feedback", async () => {
    mockApi([]);
    renderPage();
    expect(
      await screen.findByText("No feedback from the Administrator yet."),
    ).toBeDefined();
  });
});

describe("reportSteps (BR-07)", () => {
  it("follows the agreed statuses", () => {
    expect(reportSteps("SUBMITTED").map((step) => step.state)).toEqual([
      "current",
      "todo",
    ]);
    expect(reportSteps("NEED_REVISION").map((step) => step.label)).toEqual([
      "Submitted",
      "Need Revision",
      "Approved",
    ]);
    expect(reportSteps("APPROVED").map((step) => step.state)).toEqual([
      "done",
      "current",
    ]);
  });
});
