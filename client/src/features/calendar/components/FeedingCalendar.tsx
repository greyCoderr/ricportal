import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import { addDays, weekdayIndex } from "@ricportal/shared";
import { useMemo } from "react";
import { formatMenuName } from "../../../lib/format";
import type { DayRange } from "../hooks";

export type CalendarEntry = { date: string; menuName: string };

// One all-day chip per feeding day (BR-09: date-only strings). Saturday and
// Sunday items are quieter (DESIGN_LANGUAGE rule 4).
export function toEvents(days: CalendarEntry[]) {
  return days.map((day) => {
    const weekday = weekdayIndex(day.date);
    return {
      id: day.date,
      title: formatMenuName(day.menuName),
      start: day.date,
      allDay: true,
      classNames: weekday === 0 || weekday === 6 ? ["ric-quiet"] : [],
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

function isPhone(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

type FeedingCalendarProps = {
  days: CalendarEntry[];
  onRangeChange: (range: DayRange) => void;
  onDayClick: (date: string) => void;
};

// Read-only: no selection, no drag, no resize. Month on desktop, list on
// phones. The week view is cut (docs/SPRINT_SHORTCUTS.md).
export function FeedingCalendar({
  days,
  onRangeChange,
  onDayClick,
}: FeedingCalendarProps) {
  const events = useMemo(() => toEvents(days), [days]);
  return (
    <div className="ric-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView={isPhone() ? "listMonth" : "dayGridMonth"}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        height="auto"
        firstDay={0}
        editable={false}
        selectable={false}
        eventInteractive
        dayMaxEventRows={false}
        events={events}
        noEventsText="No menu uploaded for this month."
        eventClick={(info: EventClickArg) => {
          onDayClick(info.event.id);
        }}
        datesSet={(info: DatesSetArg) => {
          onRangeChange(rangeFromDates(info.startStr, info.endStr));
        }}
      />
    </div>
  );
}
