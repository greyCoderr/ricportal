import {
  teacherCreateSchema,
  teacherPatchSchema,
  type TeacherDto,
} from "@ricportal/shared";
import { useState } from "react";
import { SelectField, TextField } from "../../../components/form/fields";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { TemporaryPasswordDialog } from "../../../components/TemporaryPasswordDialog";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  Pagination,
  Table,
} from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { AccountStatusBadge } from "../components/StatusBadges";
import {
  useCenters,
  useCreateTeacher,
  useResetTeacherPassword,
  useTeachers,
  useUpdateTeacher,
} from "../hooks";

function useActiveCenterOptions() {
  const centers = useCenters({ page: 1, pageSize: 100 });
  return (centers.data?.data ?? []).filter((center) => center.isActive);
}

function CreateTeacherForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (name: string, password: string) => void;
}) {
  const create = useCreateTeacher();
  const centers = useActiveCenterOptions();
  const form = useZodForm(teacherCreateSchema, {
    fullName: "",
    username: "",
    mobile: "",
    centerId: "",
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a RIC Teacher"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="teacher-form" loading={create.isPending}>
            Create account
          </Button>
        </>
      }
    >
      <form
        id="teacher-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          create.mutate(data, {
            onSuccess: (teacher) => {
              onCreated(teacher.fullName, teacher.temporaryPassword);
            },
            onError: (error) => {
              form.applyError(error);
            },
          });
        })}
      >
        <TextField form={form} name="fullName" label="Full name" required />
        <TextField form={form} name="username" label="Username" required />
        <TextField
          form={form}
          name="mobile"
          label="Mobile number"
          inputMode="tel"
        />
        <SelectField
          form={form}
          name="centerId"
          label="RIC Children Center"
          required
          placeholder="Select..."
        >
          {centers.map((center) => (
            <option key={center.id} value={String(center.id)}>
              {center.name}
            </option>
          ))}
        </SelectField>
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

function EditTeacherForm({
  teacher,
  onClose,
}: {
  teacher: TeacherDto;
  onClose: () => void;
}) {
  const update = useUpdateTeacher();
  const centers = useActiveCenterOptions();
  const form = useZodForm(teacherPatchSchema, {
    fullName: teacher.fullName,
    mobile: teacher.mobile ?? "",
    centerId: teacher.centerId === null ? "" : String(teacher.centerId),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${teacher.fullName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="teacher-edit-form"
            loading={update.isPending}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        id="teacher-edit-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          update.mutate(
            { id: teacher.id, patch: data },
            {
              onSuccess: onClose,
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
        })}
      >
        <TextField form={form} name="fullName" label="Full name" required />
        <TextField
          form={form}
          name="mobile"
          label="Mobile number"
          inputMode="tel"
        />
        <SelectField
          form={form}
          name="centerId"
          label="RIC Children Center"
          required
        >
          {centers.map((center) => (
            <option key={center.id} value={String(center.id)}>
              {center.name}
            </option>
          ))}
        </SelectField>
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
      </form>
    </Modal>
  );
}

export function TeachersPage() {
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeacherDto | null>(null);
  const [confirmReset, setConfirmReset] = useState<TeacherDto | null>(null);
  const [temporary, setTemporary] = useState<{
    name: string;
    password: string;
  } | null>(null);
  const teachers = useTeachers(page);
  const update = useUpdateTeacher();
  const reset = useResetTeacherPassword();
  const toast = useToast();

  function toggleStatus(teacher: TeacherDto) {
    update.mutate(
      {
        id: teacher.id,
        patch: { status: teacher.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
      },
      {
        onError: (error) => {
          toast.show({ kind: "error", message: error.message });
        },
      },
    );
  }

  return (
    <>
      <PageHeader
        title="RIC Teachers"
        description="One active RIC Teacher for each center."
        actions={
          <Button
            icon="plus"
            onClick={() => {
              setAdding(true);
            }}
          >
            Add RIC Teacher
          </Button>
        }
      />
      <QueryBoundary
        query={teachers}
        errorTitle="Could not load the RIC Teachers."
      >
        {teachers.data?.data.length === 0 ? (
          <EmptyState title="No RIC Teachers yet.">
            Add the first RIC Teacher and assign a center.
          </EmptyState>
        ) : (
          <>
            <Table
              caption="RIC Teachers"
              rows={teachers.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Name", render: (row) => row.fullName },
                {
                  key: "username",
                  header: "Username",
                  render: (row) => row.username,
                },
                {
                  key: "center",
                  header: "Center",
                  render: (row) => row.centerName ?? "",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <AccountStatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Edit ${row.fullName}`}
                        onClick={() => {
                          setEditing(row);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`${row.status === "ACTIVE" ? "Disable" : "Enable"} ${row.fullName}`}
                        onClick={() => {
                          toggleStatus(row);
                        }}
                      >
                        {row.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Reset password of ${row.fullName}`}
                        onClick={() => {
                          setConfirmReset(row);
                        }}
                      >
                        Reset password
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
            <Pagination
              page={teachers.data?.meta.page ?? page}
              pageSize={teachers.data?.meta.pageSize ?? 20}
              total={teachers.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>

      {adding && (
        <CreateTeacherForm
          onClose={() => {
            setAdding(false);
          }}
          onCreated={(name, password) => {
            setAdding(false);
            setTemporary({ name, password });
          }}
        />
      )}
      {editing !== null && (
        <EditTeacherForm
          teacher={editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={confirmReset !== null}
        title="Reset this password?"
        confirmLabel="Reset password"
        loading={reset.isPending}
        onCancel={() => {
          setConfirmReset(null);
        }}
        onConfirm={() => {
          if (confirmReset === null) {
            return;
          }
          reset.mutate(confirmReset.id, {
            onSuccess: (result) => {
              setTemporary({
                name: confirmReset.fullName,
                password: result.temporaryPassword,
              });
              setConfirmReset(null);
            },
            onError: (error) => {
              setConfirmReset(null);
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        {confirmReset?.fullName} will get a temporary password and must change
        it at the next login.
      </ConfirmDialog>
      {temporary !== null && (
        <TemporaryPasswordDialog
          open
          personName={temporary.name}
          password={temporary.password}
          onClose={() => {
            setTemporary(null);
          }}
        />
      )}
    </>
  );
}
