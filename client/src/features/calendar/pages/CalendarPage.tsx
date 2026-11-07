import { manilaToday, mondayOf, monthRange } from "@ricportal/shared";
import { useCallback, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import {
  Button,
  ErrorState,
  FormField,
  Select,
  Skeleton,
  SkeletonGroup,
} from "../../../components/ui";
import { formatPeso } from "../../../lib/format";
import { useCenters } from "../../accounts/hooks";
import { useCurrentUser } from "../../auth/components/guards";
import { AssignParentsModal } from "../../purchase/components/AssignParentsModal";
import {
  AdminPurchaseRequest,
  PurchaseRequestEditor,
} from "../../purchase/components/PurchaseRequestEditor";
import { useAssignmentWeek } from "../../purchase/hooks";
import { LiquidationOverlay } from "../../reports/components/LiquidationOverlay";
import { useLiquidationPreview } from "../../reports/hooks";
import { DayPanels } from "../components/DayPanels";
import { FeedingCalendar } from "../components/FeedingCalendar";
import { useCalendar, type DayRange } from "../hooks";

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

// D5: one line for the month; the table itself is in the overlay's Summary tab.
function MonthSummary({ date, onOpen }: { date: string; onOpen: () => void }) {
  const { from, to } = monthRange(date);
  const preview = useLiquidationPreview(from, to);
  if (preview.data === undefined) {
    return null;
  }
  return (
    <p className="mt-6 flex flex-wrap items-center gap-x-3 text-15">
      <span>
        This month: {preview.data.days.length} feeding days, total{" "}
        <span className="tabular-nums">{formatPeso(preview.data.total)}</span>.
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-11 items-center font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        View Summary of Disbursement
      </button>
    </p>
  );
}

function TeacherDayPanels({
  date,
  menuName,
  onAssign,
}: {
  date: string;
  menuName: string | null;
  onAssign: () => void;
}) {
  const week = useAssignmentWeek(mondayOf(date));
  const parents = week.data?.days.find((day) => day.date === date)?.parents;
  return (
    <DayPanels
      date={date}
      menuName={menuName}
      parents={parents ?? []}
      parentsAction={
        <Button variant="secondary" icon="users" onClick={onAssign}>
          Assign Parents
        </Button>
      }
      purchaseRequest={
        menuName === null ? (
          <p className="text-center text-15 text-text-secondary">
            There is no menu for this date.
          </p>
        ) : (
          <PurchaseRequestEditor date={date} />
        )
      }
    />
  );
}

function AdminDayPanels({
  date,
  menuName,
  centerId,
}: {
  date: string;
  menuName: string | null;
  centerId: number | null;
}) {
  return (
    <DayPanels
      date={date}
      menuName={menuName}
      purchaseRequest={
        menuName === null ? (
          <p className="text-center text-15 text-text-secondary">
            There is no menu for this date.
          </p>
        ) : centerId === null ? (
          <p className="text-center text-15 text-text-secondary">
            Choose a center above to read its Purchase Request.
          </p>
        ) : (
          <AdminPurchaseRequest date={date} centerId={centerId} />
        )
      }
    />
  );
}

// The calendar page for the Admin and the Teacher (Figma 166:1553, 378:15722):
// the month, then the panels of the chosen day. Both see the same menus (P4-T11).
export function CalendarPage() {
  const user = useCurrentUser();
  const [range, setRange] = useState<DayRange | null>(null);
  const [selected, setSelected] = useState(() => manilaToday());
  const [centerId, setCenterId] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<"requests" | "summary" | null>(null);
  const [assigning, setAssigning] = useState(false);
  const calendar = useCalendar(range);
  const days = calendar.data ?? [];
  const menuName = days.find((day) => day.date === selected)?.menuName ?? null;

  const handleRange = useCallback((next: DayRange) => {
    setRange((current) =>
      current?.from === next.from && current.to === next.to ? current : next,
    );
  }, []);

  function openAssign() {
    setAssigning(true);
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          user.role === "TEACHER" ? (
            <>
              <Button icon="users" onClick={openAssign}>
                Assign Parents
              </Button>
              <Button
                variant="secondary"
                icon="file-text"
                onClick={() => {
                  setOverlay("requests");
                }}
              >
                Liquidation Forms
              </Button>
            </>
          ) : undefined
        }
      />
      {overlay !== null && (
        <LiquidationOverlay
          initialTab={overlay}
          onClose={() => {
            setOverlay(null);
          }}
        />
      )}
      {assigning && (
        <AssignParentsModal
          initialMonday={mondayOf(selected)}
          onClose={() => {
            setAssigning(false);
          }}
        />
      )}
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
        selectedDate={selected}
        onRangeChange={handleRange}
        onDayClick={setSelected}
      />
      {user.role === "TEACHER" ? (
        <>
          <TeacherDayPanels
            date={selected}
            menuName={menuName}
            onAssign={openAssign}
          />
          <MonthSummary
            date={selected}
            onOpen={() => {
              setOverlay("summary");
            }}
          />
        </>
      ) : (
        <AdminDayPanels
          date={selected}
          menuName={menuName}
          centerId={centerId}
        />
      )}
    </>
  );
}
