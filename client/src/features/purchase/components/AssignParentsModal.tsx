import {
  addDays,
  WEEK_TEAM_MAX,
  type ApprovedParent,
  type AssignmentWeek,
} from "@ricportal/shared";
import { useState } from "react";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  Checkbox,
  EmptyState,
  FormField,
  Modal,
  Select,
} from "../../../components/ui";
import { formatDate, formatMenuName } from "../../../lib/format";
import { useApprovedParents, useAssignmentWeek, useSaveWeek } from "../hooks";
import {
  applyFirstDayToAll,
  buildWeekSave,
  daysWithoutParent,
  feedingDays,
  initialPicks,
  initialSlots,
  picksForDay,
  teamIds,
  togglePick,
  type DayPicks,
  type TeamSlots,
} from "../week-plan";

function parentLabel(parent: ApprovedParent): string {
  return `${parent.fullName} (${parent.username})`;
}

function plural(count: number, word: string): string {
  return `${String(count)} ${word}${count === 1 ? "" : "s"}`;
}

// Figma shows "Week 1": the week of the month that its Monday falls in.
function weekLabel(monday: string): string {
  return `Week ${String(Math.ceil(Number(monday.slice(8)) / 7))}`;
}

function TeamStep({
  parents,
  slots,
  onChange,
}: {
  parents: ApprovedParent[];
  slots: TeamSlots;
  onChange: (slots: TeamSlots) => void;
}) {
  return (
    <ol className="flex flex-col gap-3 rounded-cell border border-border-subtle p-4">
      {slots.map((value, index) => {
        const taken = slots.filter(
          (id, other) => id !== null && other !== index,
        );
        return (
          <li key={index} className="flex items-center gap-3">
            <span aria-hidden="true" className="w-5 text-15 font-semibold">
              {index + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <FormField label={`Team member ${String(index + 1)}`} hideLabel>
                {(field) => (
                  <Select
                    {...field}
                    value={value === null ? "" : String(value)}
                    onChange={(event) => {
                      const next = [...slots];
                      next[index] =
                        event.target.value === ""
                          ? null
                          : Number(event.target.value);
                      onChange(next);
                    }}
                  >
                    <option value="">Choose a Parent</option>
                    {parents
                      .filter((parent) => !taken.includes(parent.id))
                      .map((parent) => (
                        <option key={parent.id} value={String(parent.id)}>
                          {parentLabel(parent)}
                        </option>
                      ))}
                  </Select>
                )}
              </FormField>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DaysStep({
  week,
  parents,
  team,
  picks,
  onChange,
}: {
  week: AssignmentWeek;
  parents: ApprovedParent[];
  team: number[];
  picks: DayPicks;
  onChange: (picks: DayPicks) => void;
}) {
  const days = feedingDays(week.days);
  const dates = days.map((day) => day.date);
  const members = team.flatMap((id) => {
    const parent = parents.find((row) => row.id === id);
    return parent === undefined ? [] : [parent];
  });
  const empty = daysWithoutParent(picks, dates, team);

  if (days.length === 0) {
    return <EmptyState title="This week has no feeding days." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {empty.length > 0 && (
        <Banner tone="warning">
          {plural(empty.length, "day")} with no parent yet.
        </Banner>
      )}
      <div>
        <Button
          variant="secondary"
          onClick={() => {
            onChange(applyFirstDayToAll(picks, dates));
          }}
        >
          Apply to all days
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {days.map((day) => {
          const chosen = picksForDay(picks, day.date, team);
          return (
            <li
              key={day.date}
              className="rounded-control border border-border-subtle p-3 md:grid md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-4"
            >
              <div>
                <p className="text-13 text-text-secondary">
                  {day.dayName}, {formatDate(day.date)}
                </p>
                <p className="text-15 font-semibold">
                  {formatMenuName(day.menuName ?? "")}
                </p>
                <p className="text-13 tabular-nums">
                  {`${String(chosen.length)} of ${plural(team.length, "parent")}`}
                </p>
                {chosen.length === 0 && (
                  <p className="text-13 font-medium text-warning-text">
                    No parent assigned
                  </p>
                )}
              </div>
              <ul className="mt-2 grid gap-x-3 sm:grid-cols-2 md:mt-0">
                {members.map((member) => (
                  <li key={member.id}>
                    <Checkbox
                      label={member.fullName}
                      aria-label={`${member.fullName} on ${formatDate(day.date)}`}
                      checked={chosen.includes(member.id)}
                      onChange={(event) => {
                        onChange(
                          togglePick(
                            picks,
                            day.date,
                            member.id,
                            event.target.checked,
                          ),
                        );
                      }}
                    />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WeekEditor({
  week,
  parents,
  saving,
  error,
  onSave,
  onCancel,
}: {
  week: AssignmentWeek;
  parents: ApprovedParent[];
  saving: boolean;
  error: string | null;
  onSave: (slots: TeamSlots, picks: DayPicks) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [slots, setSlots] = useState<TeamSlots>(() => initialSlots(week));
  const [picks, setPicks] = useState<DayPicks>(() => initialPicks(week));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-13 font-medium">
        Step {step} of 2:{" "}
        {step === 1
          ? `pick the team for this week, up to ${String(WEEK_TEAM_MAX)} parents`
          : "choose the parents for each day"}
      </p>
      {step === 1 ? (
        <TeamStep parents={parents} slots={slots} onChange={setSlots} />
      ) : (
        <DaysStep
          week={week}
          parents={parents}
          team={teamIds(slots)}
          picks={picks}
          onChange={setPicks}
        />
      )}
      {error !== null && <Banner tone="danger">{error}</Banner>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          CANCEL
        </Button>
        {step === 2 && (
          <Button
            variant="secondary"
            onClick={() => {
              setStep(1);
            }}
          >
            Back
          </Button>
        )}
        {step === 1 ? (
          <Button
            onClick={() => {
              setStep(2);
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            loading={saving}
            onClick={() => {
              onSave(slots, picks);
            }}
          >
            SAVE
          </Button>
        )}
      </div>
    </div>
  );
}

// Assign Parents (Figma 166:1553; Step 2 is Developer-designed from D4). The team
// is chosen first, then the parents of each feeding day, and one Save sends the
// whole week. Under 768 px each day is a card.
export function AssignParentsModal({
  initialMonday,
  onClose,
}: {
  initialMonday: string;
  onClose: () => void;
}) {
  const [monday, setMonday] = useState(initialMonday);
  const [error, setError] = useState<string | null>(null);
  const week = useAssignmentWeek(monday);
  const parents = useApprovedParents();
  const save = useSaveWeek();
  const toast = useToast();

  function moveWeek(days: number) {
    setError(null);
    setMonday(addDays(monday, days));
  }

  return (
    <Modal open wide onClose={onClose} title="Assign Parents">
      <p className="mb-3 text-13 text-text-secondary">
        Assign parents to cook foods.
      </p>
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="secondary"
          aria-label="Previous week"
          onClick={() => {
            moveWeek(-7);
          }}
        >
          ‹
        </Button>
        <div className="min-w-0">
          <p className="text-18 font-semibold tracking-label">
            {weekLabel(monday)}
          </p>
          <p className="text-13 text-text-secondary tabular-nums">
            {formatDate(monday)} to {formatDate(addDays(monday, 6))}
          </p>
        </div>
        <Button
          variant="secondary"
          aria-label="Next week"
          onClick={() => {
            moveWeek(7);
          }}
        >
          ›
        </Button>
      </div>
      <QueryBoundary query={week} errorTitle="Could not load this week.">
        <QueryBoundary query={parents} errorTitle="Could not load the Parents.">
          {parents.data?.length === 0 ? (
            <EmptyState title="No approved Parents yet.">
              Approve Parent requests first.
            </EmptyState>
          ) : (
            week.data !== undefined &&
            // A new key per week resets the working copy to that week's data.
            parents.data !== undefined && (
              <WeekEditor
                key={monday}
                week={week.data}
                parents={parents.data}
                saving={save.isPending}
                error={error}
                onCancel={onClose}
                onSave={(slots, picks) => {
                  setError(null);
                  save.mutate(
                    buildWeekSave(
                      monday,
                      slots,
                      picks,
                      feedingDays(week.data.days).map((day) => day.date),
                    ),
                    {
                      onSuccess: () => {
                        toast.show({
                          kind: "success",
                          message: "The assignments for this week were saved.",
                        });
                        onClose();
                      },
                      onError: (failure) => {
                        setError(failure.message);
                      },
                    },
                  );
                }}
              />
            )
          )}
        </QueryBoundary>
      </QueryBoundary>
    </Modal>
  );
}
