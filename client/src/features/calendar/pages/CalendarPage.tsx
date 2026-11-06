import { mondayOf, type CalendarDay } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  FormField,
  Select,
  Skeleton,
  SkeletonGroup,
  Tabs,
} from "../../../components/ui";
import { formatLongDay, formatMenuName } from "../../../lib/format";
import { useCenters } from "../../accounts/hooks";
import { useCurrentUser } from "../../auth/components/guards";
import { AssignParentsDialog } from "../../purchase/components/AssignParentsDialog";
import {
  AdminPurchaseRequest,
  PurchaseRequestEditor,
} from "../../purchase/components/PurchaseRequestEditor";
import { useSetAssignments, useWeek } from "../../purchase/hooks";
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

function AssignedParentsTab({ date }: { date: string }) {
  const monday = mondayOf(date);
  const week = useWeek(monday);
  const assign = useSetAssignments(monday);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const day = week.data?.find((row) => row.date === date);
  const parents = day?.parents ?? [];
  return (
    <QueryBoundary
      query={week}
      errorTitle="Could not load the assigned Parents."
    >
      {parents.length === 0 ? (
        <EmptyState
          title={`No Parents assigned to ${formatLongDay(date)} yet.`}
        />
      ) : (
        <ul className="mb-3 flex flex-col gap-1 text-16">
          {parents.map((parent) => (
            <li key={parent.id}>{parent.fullName}</li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(true);
          }}
        >
          Assign parents
        </Button>
      </div>
      {editing && (
        <AssignParentsDialog
          title={`Parents for ${formatLongDay(date)}`}
          assigned={parents}
          saving={assign.isPending}
          onClose={() => {
            setEditing(false);
          }}
          onSave={(next) => {
            assign.mutate(
              { date, parents: next },
              {
                onSuccess: () => {
                  setEditing(false);
                },
                onError: (error) => {
                  toast.show({ kind: "error", message: error.message });
                },
              },
            );
          }}
        />
      )}
    </QueryBoundary>
  );
}

function AdminCenterSelect({
  centerId,
  onChange,
}: {
  centerId: number | null;
  onChange: (id: number | null) => void;
}) {
  const centers = useCenters({ page: 1, pageSize: 100 });
  return (
    <div className="mb-3 max-w-sm">
      <FormField
        label="RIC Children Center"
        hint="Choose a center to read its Purchase Requests."
      >
        {(field) => (
          <Select
            {...field}
            value={centerId === null ? "" : String(centerId)}
            onChange={(event) => {
              onChange(
                event.target.value === "" ? null : Number(event.target.value),
              );
            }}
          >
            <option value="">All centers (menus only)</option>
            {centers.data?.data.map((center) => (
              <option key={center.id} value={String(center.id)}>
                {center.name}
              </option>
            ))}
          </Select>
        )}
      </FormField>
    </div>
  );
}

// Calendar for Admin and Teacher. Both see the same menus (P4-T11). The panel
// has tabs for the Teacher, and a read-only Purchase Request for the Admin once
// a center is chosen (P5-T13, P5-T16).
export function CalendarPage() {
  const user = useCurrentUser();
  const [range, setRange] = useState<DayRange | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<number | null>(null);
  const calendar = useCalendar(range);
  const days = calendar.data ?? [];
  const open = days.find((day) => day.date === openDate) ?? null;

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  const panel =
    open === null ? null : user.role === "TEACHER" ? (
      <Tabs
        label="Day details"
        initial="purchase"
        items={[
          {
            id: "details",
            label: "Details",
            content: <DayDetails day={open} />,
          },
          {
            id: "parents",
            label: "Assigned Parents",
            content: <AssignedParentsTab date={open.date} />,
          },
          {
            id: "purchase",
            label: "Purchase Request",
            content: <PurchaseRequestEditor date={open.date} />,
          },
        ]}
      />
    ) : centerId === null ? (
      <DayDetails day={open} />
    ) : (
      <Tabs
        label="Day details"
        items={[
          {
            id: "details",
            label: "Details",
            content: <DayDetails day={open} />,
          },
          {
            id: "purchase",
            label: "Purchase Request",
            content: (
              <AdminPurchaseRequest date={open.date} centerId={centerId} />
            ),
          },
        ]}
      />
    );

  return (
    <>
      <PageHeader
        title="Calendar"
        description="The DSWD menu for each feeding day."
      />
      {user.role === "ADMIN" && (
        <AdminCenterSelect centerId={centerId} onChange={setCenterId} />
      )}
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
        wide
        open={open !== null}
        onClose={() => {
          setOpenDate(null);
        }}
        title={open === null ? "" : formatLongDay(open.date)}
      >
        {panel}
      </Drawer>
    </>
  );
}
