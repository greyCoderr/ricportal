import type { CalendarDay } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import {
  Drawer,
  ErrorState,
  Skeleton,
  SkeletonGroup,
} from "../../../components/ui";
import { formatLongDay, formatMenuName } from "../../../lib/format";
import { FeedingCalendar } from "../components/FeedingCalendar";
import { useCalendar, type DayRange } from "../hooks";

export function DayDetails({ day }: { day: CalendarDay }) {
  return (
    <dl className="flex flex-col gap-3">
      <div>
        <dt className="text-13 text-text-secondary">DSWD Day {day.dayNo}</dt>
        <dd className="text-20 font-semibold">
          {formatMenuName(day.menuName)}
        </dd>
      </div>
      <div>
        <dt className="text-13 text-text-secondary">PR No.</dt>
        <dd className="text-16">{day.prNo}</dd>
      </div>
      <div>
        <dt className="text-13 text-text-secondary">PR date</dt>
        <dd className="text-16">{day.prDate}</dd>
      </div>
    </dl>
  );
}

// Calendar for Admin and Teacher. Both see the same menus (P4-T11).
export function CalendarPage() {
  const [range, setRange] = useState<DayRange | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const calendar = useCalendar(range);
  const days = calendar.data ?? [];
  const open = days.find((day) => day.date === openDate) ?? null;

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="The DSWD menu for each feeding day."
      />
      {calendar.isError && (
        <div className="mb-3">
          <ErrorState
            title="Could not load the menus for this month."
            message={calendar.error.message}
            onRetry={() => {
              void calendar.refetch();
            }}
            retrying={calendar.isFetching}
          />
        </div>
      )}
      {calendar.isPending && range !== null && (
        <SkeletonGroup label="Loading the menus..." className="mb-3">
          <Skeleton className="h-6 w-1/2" />
        </SkeletonGroup>
      )}
      {calendar.isSuccess && days.length === 0 && (
        <p className="mb-3 text-15 text-text-secondary">
          No menu uploaded for this month.
        </p>
      )}
      <FeedingCalendar
        days={days}
        onRangeChange={handleRange}
        onDayClick={setOpenDate}
      />
      <Drawer
        open={open !== null}
        onClose={() => {
          setOpenDate(null);
        }}
        title={open === null ? "" : formatLongDay(open.date)}
      >
        {open !== null && <DayDetails day={open} />}
      </Drawer>
    </>
  );
}
