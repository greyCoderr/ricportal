import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { addDays, weekdayIndex } from "@ricportal/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatMenuName } from "../../../lib/format";
import type { DayRange } from "../hooks";
import { WEEKDAY_LABELS } from "../mini-calendar";

export type CalendarEntry = { date: string; menuName: string; mine?: boolean };

// One all-day chip per feeding day (BR-09: date-only strings). Saturday and
// Sunday items are quieter (DESIGN_LANGUAGE rule 4). A Parent's own days are
// marked (D2).
export function toEvents(days: CalendarEntry[]) {
  return days.map((day) => {
    const weekday = weekdayIndex(day.date);
    return {
      id: day.date,
      title: formatMenuName(day.menuName),
      start: day.date,
      allDay: true,
      classNames: [
        ...(weekday === 0 || weekday === 6 ? ["ric-quiet"] : []),
        ...(day.mine === true ? ["ric-mine"] : []),
      ],
    };
  });
}

// FullCalendar's range end is exclusive and its strings carry an offset; the
// first ten characters are the local day it means.
export function rangeFromDates(startStr: string, endStr: string): DayRange {
  return {
    from: startStr.slice(0, 10),
    to: addDays(endStr.slice(0, 10), -1),
  };
}

// Figma's weekday bar, shared with the mini calendar.
export { WEEKDAY_LABELS };

// FullCalendar hands a local Date for a cell; this is the day it shows.
export function cellDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${String(date.getFullYear())}-${month}-${day}`;
}

// "November 2026" as the two parts that Figma sets apart.
export function splitTitle(title: string): { month: string; year: string } {
  const [month = "", year = ""] = title.split(" ");
  return { month: month.toUpperCase(), year };
}

const COMPACT_QUERY = "(min-width: 1024px) and (pointer: fine)";

function useCompactScreen(): boolean {
  const [compact, setCompact] = useState(
    () => window.matchMedia?.(COMPACT_QUERY).matches ?? false,
  );
  useEffect(() => {
    const query = window.matchMedia?.(COMPACT_QUERY);
    if (query === undefined) return undefined;
    const update = () => {
      setCompact(query.matches);
    };
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
    };
  }, []);
  return compact;
}

type FeedingCalendarProps = {
  days: CalendarEntry[];
  selectedDate: string;
  tone?: "green" | "red";
  // Fill the parent's height on a desktop, for a dashboard that must not scroll.
  fit?: boolean;
  // The month to open at (Plan 4 D2: a day clicked on a dashboard).
  initialDate?: string | undefined;
  onRangeChange: (range: DayRange) => void;
  onDayClick: (date: string) => void;
};

// Read-only: no selection, no drag, no resize. A month grid at every width, as
// the client's phone frames show (378:15461, 393:1133).
export function FeedingCalendar({
  days,
  selectedDate,
  tone = "green",
  fit = false,
  initialDate,
  onRangeChange,
  onDayClick,
}: FeedingCalendarProps) {
  const events = useMemo(() => toEvents(days), [days]);
  const calendar = useRef<FullCalendar>(null);
  const [title, setTitle] = useState({ month: "", year: "" });
  const titleColor = tone === "red" ? "text-primary" : "text-accent";
  const compact = useCompactScreen();
  const filling = fit && compact;

  return (
    <div
      className={`ric-calendar ${tone === "red" ? "ric-calendar-parent" : ""} ${filling ? "ric-calendar-fit" : ""}`}
    >
      {/* The arrow sits on the page's left edge, under the page title (D5). */}
      <div className={`mb-2 flex shrink-0 items-center gap-1 ${titleColor}`}>
        <button
          type="button"
          aria-label="Previous month"
          className="inline-flex size-11 items-center justify-start rounded-control text-24 lg:text-42 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          onClick={() => calendar.current?.getApi().prev()}
        >
          ‹
        </button>
        <h2 aria-live="polite" className="text-24 font-extrabold lg:text-48">
          {title.month}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          className="inline-flex size-11 items-center justify-center rounded-control text-24 lg:text-42 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          onClick={() => calendar.current?.getApi().next()}
        >
          ›
        </button>
        <p className="ml-auto text-20 font-extrabold lg:text-24">
          {title.year}
        </p>
      </div>
      <div className={filling ? "min-h-0 flex-1" : ""}>
        <FullCalendar
          ref={calendar}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          {...(initialDate === undefined ? {} : { initialDate })}
          headerToolbar={false}
          height={filling ? "100%" : "auto"}
          // Weeks share the height equally, six-week months too (D5).
          expandRows={filling}
          // Names show two lines at most; the whole name is in the tooltip.
          eventDidMount={(info) => {
            info.el.title = info.event.title;
          }}
          firstDay={0}
          editable={false}
          selectable={false}
          eventInteractive
          dayMaxEventRows={false}
          events={events}
          dayHeaderContent={(arg) => WEEKDAY_LABELS[arg.date.getDay()]}
          dayCellClassNames={(arg) =>
            cellDate(arg.date) === selectedDate ? ["ric-selected"] : []
          }
          dayCellContent={(arg) => {
            const date = cellDate(arg.date);
            return (
              <button
                type="button"
                className="ric-day-button"
                aria-pressed={date === selectedDate}
                aria-label={`Show ${formatDate(date)}`}
                onClick={() => {
                  onDayClick(date);
                }}
              >
                {arg.dayNumberText}
              </button>
            );
          }}
          eventClick={(info: EventClickArg) => {
            onDayClick(info.event.id);
          }}
          datesSet={(info: DatesSetArg) => {
            setTitle(splitTitle(info.view.title));
            onRangeChange(rangeFromDates(info.startStr, info.endStr));
          }}
        />
      </div>
    </div>
  );
}
