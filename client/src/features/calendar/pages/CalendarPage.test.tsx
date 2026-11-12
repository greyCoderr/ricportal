import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import type { DayRange } from "../hooks";

// FullCalendar needs a real browser: the mock reports November 2026's grid.
const { initialDates } = vi.hoisted(() => ({
  initialDates: [] as (string | undefined)[],
}));
vi.mock("../components/FeedingCalendar", () => ({
  FeedingCalendar: ({
    onRangeChange,
    initialDate,
  }: {
    onRangeChange: (range: DayRange) => void;
    initialDate?: string;
  }) => {
    initialDates.push(initialDate);
    useEffect(() => {
      onRangeChange({ from: "2026-11-01", to: "2026-12-12" });
    }, [onRangeChange]);
    return <p>Full calendar</p>;
  },
}));
vi.mock("../../auth/components/guards", () => ({
  useCurrentUser: () => ({
    id: 1,
    role: "ADMIN",
    username: "admin",
    fullName: "MAO Administrator",
    centerId: null,
    centerName: null,
    mustChangePassword: false,
  }),
}));

const { CalendarPage } = await import("./CalendarPage");

function mockApi(days: { date: string; menuName: string }[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const body = path.startsWith("/api/calendar")
        ? { data: days, meta: {} }
        : { data: [], meta: { page: 1, pageSize: 100, total: 0 } };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
}

function renderPage(path = "/calendar") {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <CalendarPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  initialDates.length = 0;
});

describe("CalendarPage, Admin (Plan 4 D6)", () => {
  it("shows the banner with the month when the month has no menu", async () => {
    // Only days of the next month, which the six-week grid also shows.
    mockApi([{ date: "2026-12-02", menuName: "Pork Nilaga" }]);
    renderPage();
    expect(
      await screen.findByText("No Menu/Food Rotation Upload for November 2026"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Please upload a document containing the menu/food rotation for this month.",
      ),
    ).toBeDefined();
  });

  it("hides the banner when the month has a menu", async () => {
    mockApi([{ date: "2026-11-04", menuName: "Pork Nilaga" }]);
    renderPage();
    await screen.findByText("Upload Menu/Food Rotation");
    await waitFor(() => {
      expect(screen.queryByText(/No Menu\/Food Rotation Upload/)).toBe(null);
    });
  });

  it("Upload Document opens the upload card", async () => {
    mockApi([]);
    renderPage();
    const button = await screen.findByRole(
      "button",
      { name: "Upload Document" },
      { timeout: 5000 },
    );
    fireEvent.click(button);
    expect(document.activeElement).toBe(
      screen.getByLabelText("Choose the DSWD Excel file"),
    );
  });

  it("opens at the date in the address (from the dashboard's mini calendar)", async () => {
    mockApi([]);
    renderPage("/calendar?date=2027-01-20");
    await screen.findByText("Full calendar");
    expect(initialDates[0]).toBe("2027-01-20");
  });

  it("keeps the center selector in the header row", () => {
    mockApi([]);
    renderPage();
    expect(screen.getByLabelText("RIC Children Center")).toBeDefined();
  });
});
