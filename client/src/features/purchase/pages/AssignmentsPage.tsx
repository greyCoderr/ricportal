import {
  addDays,
  manilaToday,
  mondayOf,
  type AssignmentDay,
} from "@ricportal/shared";
import { useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import { Button, Card, Icon } from "../../../components/ui";
import { formatLongDay, formatMenuName } from "../../../lib/format";
import { AssignParentsDialog } from "../components/AssignParentsDialog";
import { PrStatusBadge } from "../components/PrStatusBadge";
import { useSetAssignments, useWeek } from "../hooks";

// Weekly Assignment board (phase 5): Monday to Sunday. Next week is assigned
// again (BR-13).
export function AssignmentsPage() {
  const [monday, setMonday] = useState(() => mondayOf(manilaToday()));
  const [editing, setEditing] = useState<AssignmentDay | null>(null);
  const week = useWeek(monday);
  const assign = useSetAssignments(monday);
  const toast = useToast();

  function save(day: AssignmentDay, parents: AssignmentDay["parents"]) {
    assign.mutate(
      { date: day.date, parents },
      {
        onSuccess: () => {
          setEditing(null);
          toast.show({
            kind: "success",
            message: `Saved the Parents for ${formatLongDay(day.date)}.`,
          });
        },
        onError: (error) => {
          toast.show({ kind: "error", message: error.message });
        },
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Assignments"
        description={`${formatLongDay(monday)} to ${formatLongDay(addDays(monday, 6))}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setMonday(addDays(monday, -7));
              }}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMonday(mondayOf(manilaToday()));
              }}
            >
              This week
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMonday(addDays(monday, 7));
              }}
            >
              Next
            </Button>
          </>
        }
      />
      <QueryBoundary query={week} errorTitle="Could not load this week.">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {week.data?.map((day) => (
            <li key={day.date}>
              <Card className="flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-13 text-text-secondary">
                    {formatLongDay(day.date)}
                  </p>
                  {day.menuName !== null && (
                    <PrStatusBadge status={day.status} />
                  )}
                </div>
                <p className="text-16 font-semibold">
                  {day.menuName === null
                    ? "No menu"
                    : formatMenuName(day.menuName)}
                </p>
                {day.parents.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {day.parents.map((parent) => (
                      <li
                        key={parent.id}
                        className="inline-flex items-center gap-1 rounded-card border border-border-subtle pl-3 text-13"
                      >
                        {parent.fullName}
                        <button
                          type="button"
                          aria-label={`Remove ${parent.fullName} from ${day.date}`}
                          className="inline-flex size-11 items-center justify-center rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                          onClick={() => {
                            save(
                              day,
                              day.parents.filter((p) => p.id !== parent.id),
                            );
                          }}
                        >
                          <Icon name="x" size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={day.menuName === null}
                    aria-label={`Assign parents to ${day.date}`}
                    onClick={() => {
                      setEditing(day);
                    }}
                  >
                    Assign parents
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryBoundary>
      {editing !== null && (
        <AssignParentsDialog
          title={`Parents for ${formatLongDay(editing.date)}`}
          assigned={editing.parents}
          saving={assign.isPending}
          onClose={() => {
            setEditing(null);
          }}
          onSave={(parents) => {
            save(editing, parents);
          }}
        />
      )}
    </>
  );
}
