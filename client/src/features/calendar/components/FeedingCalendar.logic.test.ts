import { describe, expect, it, vi } from "vitest";

// FullCalendar itself needs a real browser; only the pure helpers are tested.
vi.mock("@fullcalendar/react", () => ({ default: () => null }));
vi.mock("@fullcalendar/daygrid", () => ({ default: {} }));
vi.mock("@fullcalendar/list", () => ({ default: {} }));

const { rangeFromDates, toEvents } = await import("./FeedingCalendar");

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
