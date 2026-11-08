import {
  conferenceSchema,
  homeVisitSchema,
  manilaToday,
  progressSchema,
  type ConferenceDto,
  type HomeVisitDto,
  type ProgressDto,
} from "@ricportal/shared";
import { useState } from "react";
import {
  DateField,
  TextareaField,
  TextField,
} from "../../../components/form/fields";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
} from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { useZodForm } from "../../../lib/use-zod-form";
import {
  useConferences,
  useDeleteConference,
  useDeleteHomeVisit,
  useDeleteProgress,
  useHomeVisits,
  useProgress,
  useSaveConference,
  useSaveHomeVisit,
  useSaveProgress,
} from "../hooks";

function EntryActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" aria-label={`Edit ${label}`} onClick={onEdit}>
        Edit
      </Button>
      <Button
        variant="secondary"
        aria-label={`Delete ${label}`}
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  );
}

function ConferenceForm({
  studentId,
  entry,
  onClose,
}: {
  studentId: number;
  entry: ConferenceDto | null;
  onClose: () => void;
}) {
  const save = useSaveConference(studentId);
  const form = useZodForm(conferenceSchema, {
    noteDate: entry?.noteDate ?? manilaToday(),
    noteTime: entry?.noteTime ?? "",
    notes: entry?.notes ?? "",
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={entry === null ? "Add a conference note" : "Edit conference note"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="conference-form" loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form
        id="conference-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          save.mutate(
            { studentId, id: entry?.id ?? null, data },
            {
              onSuccess: onClose,
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
        })}
      >
        <DateField form={form} name="noteDate" label="Date" required />
        <TextField form={form} name="noteTime" label="Time" type="time" />
        <TextareaField form={form} name="notes" label="Notes" required />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

export function ConferencesTab({
  studentId,
  childName,
}: {
  studentId: number;
  childName: string;
}) {
  const entries = useConferences(studentId);
  const remove = useDeleteConference(studentId);
  const toast = useToast();
  const [editing, setEditing] = useState<ConferenceDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<ConferenceDto | null>(null);

  return (
    <>
      <div className="mb-3">
        <Button
          icon="plus"
          onClick={() => {
            setEditing("new");
          }}
        >
          Add conference note
        </Button>
      </div>
      <QueryBoundary
        query={entries}
        errorTitle="Could not load the conference notes."
      >
        {entries.data?.length === 0 ? (
          <EmptyState
            title={`No One-on-One Conferences for ${childName} yet.`}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.data?.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-15 font-semibold">
                      {formatDate(entry.noteDate)}
                      {entry.noteTime === null ? "" : `, ${entry.noteTime}`}
                    </p>
                    <EntryActions
                      label={`conference note of ${formatDate(entry.noteDate)}`}
                      onEdit={() => {
                        setEditing(entry);
                      }}
                      onDelete={() => {
                        setDeleting(entry);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-15 whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      {editing !== null && (
        <ConferenceForm
          studentId={studentId}
          entry={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this conference note?"
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting === null) return;
          remove.mutate(deleting.id, {
            onSettled: () => {
              setDeleting(null);
            },
            onError: (error) => {
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        The note of {formatDate(deleting?.noteDate ?? "")} will be removed from{" "}
        {childName}&apos;s record.
      </ConfirmDialog>
    </>
  );
}

function ProgressForm({
  studentId,
  entry,
  onClose,
}: {
  studentId: number;
  entry: ProgressDto | null;
  onClose: () => void;
}) {
  const save = useSaveProgress(studentId);
  const form = useZodForm(progressSchema, {
    noteDate: entry?.noteDate ?? manilaToday(),
    progressNotes: entry?.progressNotes ?? "",
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={entry === null ? "Add a progress note" : "Edit progress note"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="progress-form" loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form
        id="progress-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          save.mutate(
            { studentId, id: entry?.id ?? null, data },
            {
              onSuccess: onClose,
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
        })}
      >
        <DateField form={form} name="noteDate" label="Date" required />
        <TextareaField
          form={form}
          name="progressNotes"
          label="Progress notes"
          required
        />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

export function ProgressTab({
  studentId,
  childName,
}: {
  studentId: number;
  childName: string;
}) {
  const entries = useProgress(studentId);
  const remove = useDeleteProgress(studentId);
  const toast = useToast();
  const [editing, setEditing] = useState<ProgressDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProgressDto | null>(null);

  return (
    <>
      <div className="mb-3">
        <Button
          icon="plus"
          onClick={() => {
            setEditing("new");
          }}
        >
          Add progress note
        </Button>
      </div>
      <QueryBoundary
        query={entries}
        errorTitle="Could not load the progress notes."
      >
        {entries.data?.length === 0 ? (
          <EmptyState title={`No progress notes for ${childName} yet.`} />
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.data?.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-15 font-semibold">
                      {formatDate(entry.noteDate)}
                    </p>
                    <EntryActions
                      label={`progress note of ${formatDate(entry.noteDate)}`}
                      onEdit={() => {
                        setEditing(entry);
                      }}
                      onDelete={() => {
                        setDeleting(entry);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-15 whitespace-pre-wrap">
                    {entry.progressNotes}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      {editing !== null && (
        <ProgressForm
          studentId={studentId}
          entry={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this progress note?"
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting === null) return;
          remove.mutate(deleting.id, {
            onSettled: () => {
              setDeleting(null);
            },
            onError: (error) => {
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        The note of {formatDate(deleting?.noteDate ?? "")} will be removed from{" "}
        {childName}&apos;s record.
      </ConfirmDialog>
    </>
  );
}

function HomeVisitForm({
  studentId,
  entry,
  onClose,
}: {
  studentId: number;
  entry: HomeVisitDto | null;
  onClose: () => void;
}) {
  const save = useSaveHomeVisit(studentId);
  const form = useZodForm(homeVisitSchema, {
    visitDate: entry?.visitDate ?? manilaToday(),
    observation: entry?.observation ?? "",
    parentInfo: entry?.parentInfo ?? "",
    remarks: entry?.remarks ?? "",
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={entry === null ? "Add a home visit" : "Edit home visit"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="visit-form" loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form
        id="visit-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          save.mutate(
            { studentId, id: entry?.id ?? null, data },
            {
              onSuccess: onClose,
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
        })}
      >
        <DateField
          form={form}
          name="visitDate"
          label="Date of visit"
          required
        />
        <TextareaField
          form={form}
          name="observation"
          label="Observation"
          required
        />
        <TextareaField
          form={form}
          name="parentInfo"
          label="Information from the parent"
        />
        <TextareaField form={form} name="remarks" label="Remarks" />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

export function HomeVisitsTab({
  studentId,
  childName,
}: {
  studentId: number;
  childName: string;
}) {
  const entries = useHomeVisits(studentId);
  const remove = useDeleteHomeVisit(studentId);
  const toast = useToast();
  const [editing, setEditing] = useState<HomeVisitDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<HomeVisitDto | null>(null);

  return (
    <>
      <div className="mb-3">
        <Button
          icon="plus"
          onClick={() => {
            setEditing("new");
          }}
        >
          Add home visit
        </Button>
      </div>
      <QueryBoundary
        query={entries}
        errorTitle="Could not load the home visits."
      >
        {entries.data?.length === 0 ? (
          <EmptyState title={`No Home Visitations for ${childName} yet.`} />
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.data?.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-15 font-semibold">
                      {formatDate(entry.visitDate)}
                    </p>
                    <EntryActions
                      label={`home visit of ${formatDate(entry.visitDate)}`}
                      onEdit={() => {
                        setEditing(entry);
                      }}
                      onDelete={() => {
                        setDeleting(entry);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-15 whitespace-pre-wrap">
                    {entry.observation}
                  </p>
                  {entry.parentInfo !== null && (
                    <p className="mt-2 text-13 text-text-secondary">
                      From the parent: {entry.parentInfo}
                    </p>
                  )}
                  {entry.remarks !== null && (
                    <p className="mt-1 text-13 text-text-secondary">
                      Remarks: {entry.remarks}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      {editing !== null && (
        <HomeVisitForm
          studentId={studentId}
          entry={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this home visit?"
        confirmLabel="Delete"
        loading={remove.isPending}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting === null) return;
          remove.mutate(deleting.id, {
            onSettled: () => {
              setDeleting(null);
            },
            onError: (error) => {
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        The visit of {formatDate(deleting?.visitDate ?? "")} will be removed
        from {childName}
        &apos;s record.
      </ConfirmDialog>
    </>
  );
}
