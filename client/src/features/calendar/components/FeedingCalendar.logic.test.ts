import { describe, expect, it, vi } from "vitest";

// FullCalendar itself needs a real browser; only the pure helpers are tested.
vi.mock("@fullcalendar/react", () => ({ default: () => null }));
vi.mock("@fullcalendar/daygrid", () => ({ default: {} }));
vi.mock("@fullcalendar/list", () => ({ default: {} }));

const { cellDate, rangeFromDates, splitTitle, toEvents, WEEKDAY_LABELS } =
  await import("./FeedingCalendar");
const { menuHeading } = await import("./DayPanels");

describe("Figma calendar helpers", () => {
  it("uses the client's weekday labels", () => {
    expect(WEEKDAY_LABELS).toEqual([
      "Sun",
      "Mon",
      "Tues",
      "Wed",
      "Thurs",
      "Fri",
      "Sat",
    ]);
  });

  it("splits the title into an upper-case month and a year", () => {
    expect(splitTitle("November 2026")).toEqual({
      month: "NOVEMBER",
      year: "2026",
    });
  });

  it("reads a cell's local date with no time zone shift", () => {
    expect(cellDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(cellDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("marks a Parent's own day (D2)", () => {
    expect(
      toEvents([{ date: "2026-09-17", menuName: "EGG", mine: true }])[0]
        ?.classNames,
    ).toEqual(["ric-mine"]);
  });

  it("calls only today Today's Menu; other days carry the numeric date", () => {
    expect(menuHeading("2026-11-10", "2026-11-10")).toBe("Today’s Menu");
    expect(menuHeading("2026-11-11", "2026-11-10")).toBe("Menu for 11/11/2026");
  });
});

describe("toEvents", () => {
  it("makes one all-day event with the display name, keyed by the date", () => {
    expect(
      toEvents([{ date: "2026-09-17", menuName: "EGG CALDERETA" }]),
    ).toEqual([
      {
        id: "2026-09-17",
        title: "Egg Caldereta",
        start: "2026-09-17",
        allDay: true,
        classNames: [],
      },
    ]);
  });

  it("Saturday and Sunday are quieter", () => {
    const events = toEvents([
      { date: "2026-09-19", menuName: "NUTRIBUN" },
      { date: "2026-09-20", menuName: "NUTRI COOKIE" },
      { date: "2026-09-21", menuName: "PORK PICADILLO" },
    ]);
    expect(events.map((event) => event.classNames)).toEqual([
      ["ric-quiet"],
      ["ric-quiet"],
      [],
    ]);
  });
});

describe("rangeFromDates", () => {
  it("makes the exclusive end inclusive and ignores the offset", () => {
    expect(
      rangeFromDates("2026-10-25T00:00:00+08:00", "2026-12-06T00:00:00+08:00"),
    ).toEqual({ from: "2026-10-25", to: "2026-12-05" });
  });

  it("crosses a year end", () => {
    expect(rangeFromDates("2026-12-27", "2027-02-07")).toEqual({
      from: "2026-12-27",
      to: "2027-02-06",
    });
  });
});
