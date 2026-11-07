import { manilaToday } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { ErrorState } from "../../../components/ui";
import { DayPanels } from "../../calendar/components/DayPanels";
import { FeedingCalendar } from "../../calendar/components/FeedingCalendar";
import type { DayRange } from "../../calendar/hooks";
import { ParentDayScreen } from "../components/ParentDayScreen";
import { useSchedule } from "../hooks";

// The Parent home is this calendar (Figma 393:1133, DEC-024). D2: the whole
// center's menus and assigned parents; the Purchase Request only on the Parent's
// own days.
export function MySchedulePage() {
  const [range, setRange] = useState<DayRange | null>(null);
  const [selected, setSelected] = useState(() => manilaToday());
  const schedule = useSchedule(range);
  const days = schedule.data ?? [];
  const day = days.find((row) => row.date === selected);

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Tap a day. Your own days have a check mark."
      />
      {schedule.isError && (
        <div className="mb-3">
          <ErrorState
            title="Could not load the calendar."
            message={schedule.error.message}
            onRetry={() => {
              void schedule.refetch();
            }}
            retrying={schedule.isFetching}
          />
        </div>
      )}
      <FeedingCalendar
        tone="red"
        days={days.map((row) => ({
          date: row.date,
          menuName: row.menuName,
          mine: row.assigned,
        }))}
        selectedDate={selected}
        onRangeChange={handleRange}
        onDayClick={setSelected}
      />
      <DayPanels
        date={selected}
        menuName={day?.menuName ?? null}
        parents={day?.parents ?? []}
        purchaseRequest={
          day?.assigned === true ? (
            <ParentDayScreen date={selected} />
          ) : (
            <p className="text-center text-15 text-text-secondary">
              {day === undefined
                ? "There is no menu for this date."
                : "You are not assigned to this day."}
            </p>
          )
        }
      />
    </>
  );
}
