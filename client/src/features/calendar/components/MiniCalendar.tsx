import { useEffect, useMemo, useState } from "react";
import { formatDate } from "../../../lib/format";
import type { DayRange } from "../hooks";
import {
  monthGrid,
  monthTitle,
  shiftMonth,
  WEEKDAY_LABELS,
} from "../mini-calendar";

const FOCUS =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text";

type MiniCalendarProps = {
  // Days that have a menu; only their dates are used (no dish names, D2).
  days: { date: string }[];
  today: string;
  onRangeChange: (range: DayRange) => void;
  onDayClick: (date: string) => void;
};

// The dashboards' small month (Plan 4 D2): a plain CSS grid of day numbers with
// a dot on the days that have a menu. FullCalendar stays on the Calendar page.
// It fills its parent's height on a desktop, so the dashboard fits the screen.
export function MiniCalendar({
  days,
  today,
  onRangeChange,
  onDayClick,
}: MiniCalendarProps) {
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const cells = useMemo(() => monthGrid(month), [month]);
  const menuDays = useMemo(() => new Set(days.map((day) => day.date)), [days]);
  const title = monthTitle(month);
  const from = cells[0]?.date ?? "";
  const to = cells[cells.length - 1]?.date ?? "";

  useEffect(() => {
    onRangeChange({ from, to });
  }, [from, to, onRangeChange]);

  const weeks = Array.from({ length: 6 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1 flex shrink-0 items-center gap-1 text-accent">
        <button
          type="button"
          aria-label="Previous month"
          className={`inline-flex size-11 items-center justify-center rounded-control text-24 lg:text-42 compact:size-8 ${FOCUS}`}
          onClick={() => {
            setMonth((current) => shiftMonth(current, -1));
          }}
        >
          ‹
        </button>
        <h2
          aria-live="polite"
          className="text-24 leading-none font-extrabold lg:text-48"
        >
          {title.month}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          className={`inline-flex size-11 items-center justify-center rounded-control text-24 lg:text-42 compact:size-8 ${FOCUS}`}
          onClick={() => {
            setMonth((current) => shiftMonth(current, 1));
          }}
        >
          ›
        </button>
        <p className="ml-auto text-20 font-extrabold lg:text-24">
          {title.year}
        </p>
      </div>
      <div
        role="grid"
        aria-label={`${title.month} ${title.year}`}
        className="grid min-h-0 flex-1 grid-rows-[auto_repeat(6,minmax(2.5rem,1fr))] border-t border-l border-border text-12 compact:grid-rows-[auto_repeat(6,minmax(0,1fr))]"
      >
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="border-r border-b border-border bg-calendar-bar py-1 text-center font-semibold"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]?.date} role="row" className="grid grid-cols-7">
            {week.map((cell) => {
              const hasMenu = menuDays.has(cell.date);
              const isToday = cell.date === today;
              return (
                <div
                  key={cell.date}
                  role="gridcell"
                  className="min-h-0 border-r border-b border-border"
                >
                  <button
                    type="button"
                    data-date={cell.date}
                    data-has-menu={hasMenu ? "" : undefined}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`Open ${formatDate(cell.date)}${hasMenu ? ", has a menu" : ""}`}
                    onClick={() => {
                      onDayClick(cell.date);
                    }}
                    className={`relative flex size-full items-start p-1 text-left tabular-nums hover:bg-header ${
                      isToday ? "ric-mini-today bg-calendar-bar font-bold" : ""
                    } ${cell.inMonth ? "text-text" : "text-text-muted"} ${FOCUS}`}
                  >
                    {cell.day}
                    {hasMenu && (
                      <span
                        aria-hidden="true"
                        className="absolute right-1 bottom-1 size-1.5 rounded-full bg-accent"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
