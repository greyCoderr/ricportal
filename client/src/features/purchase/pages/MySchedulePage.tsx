import { useCallback, useState } from "react";
import { Drawer, ErrorState } from "../../../components/ui";
import { formatLongDay } from "../../../lib/format";
import { FeedingCalendar } from "../../calendar/components/FeedingCalendar";
import type { DayRange } from "../../calendar/hooks";
import { useCurrentUser } from "../../auth/components/guards";
import { ParentDayScreen } from "../components/ParentDayScreen";
import { useSchedule } from "../hooks";

// The Parent home is this calendar (Figma 393:1133, DEC-024): assigned days
// only, today highlighted, no Today's Feeding card.
export function MySchedulePage() {
  const user = useCurrentUser();
  const [range, setRange] = useState<DayRange | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const schedule = useSchedule(range);
  const days = schedule.data ?? [];

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <>
      <h1 className="mb-1 text-24 font-semibold">My Schedule</h1>
      <p className="mb-3 text-16">
        {schedule.isSuccess && days.length === 0
          ? `Welcome, ${user.fullName}. Your schedule will appear here once your teacher assigns you.`
          : "Tap a day to enter what you bought."}
      </p>
      {schedule.isError && (
        <div className="mb-3">
          <ErrorState
            title="Could not load your schedule."
            message={schedule.error.message}
            onRetry={() => {
              void schedule.refetch();
            }}
            retrying={schedule.isFetching}
          />
        </div>
      )}
      <FeedingCalendar
        days={days}
        onRangeChange={handleRange}
        onDayClick={setOpenDate}
      />
      <Drawer
        open={openDate !== null}
        onClose={() => {
          setOpenDate(null);
        }}
        title={openDate === null ? "" : formatLongDay(openDate)}
      >
        {openDate !== null && <ParentDayScreen date={openDate} />}
      </Drawer>
    </>
  );
}
