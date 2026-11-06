import { useState } from "react";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Button, Checkbox, EmptyState, Modal } from "../../../components/ui";
import { useApprovedParents } from "../hooks";

type Person = { id: number; fullName: string };

// A simple multi-select of approved Parents of the center.
export function AssignParentsDialog({
  title,
  assigned,
  saving,
  onSave,
  onClose,
}: {
  title: string;
  assigned: Person[];
  saving: boolean;
  onSave: (parents: Person[]) => void;
  onClose: () => void;
}) {
  const parents = useApprovedParents();
  const [chosen, setChosen] = useState(
    () => new Set(assigned.map((person) => person.id)),
  );

  function toggle(id: number, on: boolean) {
    setChosen((current) => {
      const next = new Set(current);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              onSave(
                (parents.data ?? []).filter((person) => chosen.has(person.id)),
              );
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <QueryBoundary query={parents} errorTitle="Could not load the Parents.">
        {parents.data?.length === 0 ? (
          <EmptyState title="No approved Parents yet.">
            Approve Parent requests first.
          </EmptyState>
        ) : (
          <ul>
            {parents.data?.map((person) => (
              <li key={person.id}>
                <Checkbox
                  label={person.fullName}
                  checked={chosen.has(person.id)}
                  onChange={(event) => {
                    toggle(person.id, event.target.checked);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </Modal>
  );
}
