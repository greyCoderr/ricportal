import {
  teacherCreateSchema,
  teacherPatchSchema,
  type TeacherDto,
  type TeacherListQuery,
} from "@ricportal/shared";
import { useState } from "react";
import {
  PasswordField,
  SelectField,
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
  FormField,
  Icon,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  type IconName,
} from "../../../components/ui";
import { formatInstantDate } from "../../../lib/format";
import { useZodForm } from "../../../lib/use-zod-form";
import { useDashboardSummary } from "../../dashboard/hooks";
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

// Figma shows "RIC-TCHR-2025-001"; the blueprint has no such field, so this is a
// display code from the row id, not stored (DEC-040).
export function teacherCode(id: number): string {
  return `RIC-TCHR-${String(id).padStart(3, "0")}`;
}

function CreateTeacherForm({ onClose }: { onClose: () => void }) {
  const create = useCreateTeacher();
  const centers = useActiveCenterOptions();
  const toast = useToast();
  const form = useZodForm(teacherCreateSchema, {
    fullName: "",
    username: "",
    mobile: "",
    centerId: "",
    password: "",
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Add New Teacher"
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
              toast.show({
                kind: "success",
                message: `${teacher.fullName} can now log in and must choose a new password.`,
              });
              onClose();
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
        <PasswordField
          form={form}
          name="password"
          label="Password"
          hint="Optional. Leave blank to use the default password."
          autoComplete="new-password"
        />
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

function StatCard({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: number | undefined;
  label: string;
}) {
  return (
    <Card variant="stat" className="flex items-center gap-4 p-4">
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} size={24} />
      </span>
      <div>
        <p className="text-24 font-semibold tabular-nums">{value ?? "-"}</p>
        <p className="text-13">{label}</p>
      </div>
    </Card>
  );
}

// RIC Teachers (Figma 267:9862, phones 378:16285). Disabled teachers follow D8.
export function TeachersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TeacherListQuery>({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeacherDto | null>(null);
  const [confirmReset, setConfirmReset] = useState<TeacherDto | null>(null);
  const teachers = useTeachers(page, filters);
  const summary = useDashboardSummary();
  const centers = useCenters({ page: 1, pageSize: 100 });
  const update = useUpdateTeacher();
  const reset = useResetTeacherPassword();
  const toast = useToast();
  const counts = summary.data;
  const hasFilters =
    filters.q !== undefined ||
    filters.status !== undefined ||
    filters.centerId !== undefined;

  function changeFilters(next: TeacherListQuery) {
    setFilters(next);
    setPage(1);
  }

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
      <h1 className="text-24 font-semibold lg:text-40">RIC Teachers</h1>
      <p className="mb-4 text-15 text-text-secondary">
        View approved RIC teachers and manage their accounts.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="users"
          value={
            counts === undefined
              ? undefined
              : counts.activeTeachers + counts.disabledTeachers
          }
          label="Total RIC Teachers"
        />
        <StatCard
          icon="users"
          value={counts?.activeTeachers}
          label="Active Teachers"
        />
        <StatCard
          icon="users"
          value={counts?.disabledTeachers}
          label="Disabled Teachers"
        />
        <StatCard
          icon="map-pin"
          value={counts?.centersWithTeacher}
          label="Assigned Barangays"
        />
      </div>

      <section className="rounded-card border border-border-subtle p-3 shadow-panel lg:p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <FormField label="Search" hideLabel>
              {(field) => (
                <Input
                  {...field}
                  placeholder="Search by name or username"
                  value={filters.q ?? ""}
                  onChange={(event) => {
                    const q = event.target.value;
                    changeFilters({
                      ...filters,
                      q: q === "" ? undefined : q,
                    });
                  }}
                />
              )}
            </FormField>
          </div>
          <div className="w-full sm:w-48">
            <FormField label="Barangay" hideLabel>
              {(field) => (
                <Select
                  {...field}
                  value={
                    filters.centerId === undefined
                      ? ""
                      : String(filters.centerId)
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    changeFilters({
                      ...filters,
                      centerId: value === "" ? undefined : Number(value),
                    });
                  }}
                >
                  <option value="">All Barangays</option>
                  {centers.data?.data.map((center) => (
                    <option key={center.id} value={String(center.id)}>
                      {center.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>
          <div className="w-full sm:w-40">
            <FormField label="Status" hideLabel>
              {(field) => (
                <Select
                  {...field}
                  value={filters.status ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    changeFilters({
                      ...filters,
                      status:
                        value === "ACTIVE" || value === "DISABLED"
                          ? value
                          : undefined,
                    });
                  }}
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </Select>
              )}
            </FormField>
          </div>
          <Button
            variant="secondary"
            icon="refresh-cw"
            disabled={!hasFilters}
            onClick={() => {
              changeFilters({});
            }}
          >
            Clear Filters
          </Button>
          <div className="sm:ml-auto">
            <Button
              icon="plus"
              onClick={() => {
                setAdding(true);
              }}
            >
              Add New Teacher
            </Button>
          </div>
        </div>

        <QueryBoundary
          query={teachers}
          errorTitle="Could not load the RIC Teachers."
        >
          {teachers.data?.data.length === 0 ? (
            <EmptyState
              title={
                hasFilters
                  ? "No RIC Teacher matches these filters."
                  : "No RIC Teachers yet."
              }
            >
              {hasFilters
                ? "Clear the filters to see every RIC Teacher."
                : "Add the first RIC Teacher and assign a center."}
            </EmptyState>
          ) : (
            <>
              <Table
                cardsOnPhone
                caption="RIC Teachers"
                rows={teachers.data?.data ?? []}
                rowKey={(row) => row.id}
                rowClassName={(row) =>
                  row.status === "ACTIVE" ? "" : "bg-header text-text-secondary"
                }
                columns={[
                  {
                    key: "code",
                    header: "Teacher ID",
                    render: (row) => teacherCode(row.id),
                  },
                  {
                    key: "name",
                    header: "Name",
                    render: (row) => row.fullName,
                  },
                  {
                    key: "center",
                    header: "Barangay",
                    render: (row) => row.centerName ?? "",
                  },
                  {
                    key: "username",
                    header: "Username",
                    render: (row) => row.username,
                  },
                  {
                    key: "mobile",
                    header: "Contact Number",
                    render: (row) => row.mobile ?? "",
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <AccountStatusBadge status={row.status} />,
                  },
                  {
                    key: "login",
                    header: "Last Login",
                    render: (row) =>
                      row.lastLoginAt === null
                        ? "Never"
                        : formatInstantDate(row.lastLoginAt),
                  },
                  {
                    key: "actions",
                    header: "Action",
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          aria-label={`Edit ${row.fullName}`}
                          onClick={() => {
                            setEditing(row);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label={`${row.status === "ACTIVE" ? "Disable" : "Enable"} ${row.fullName}`}
                          onClick={() => {
                            toggleStatus(row);
                          }}
                        >
                          {row.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label={`Reset password of ${row.fullName}`}
                          onClick={() => {
                            setConfirmReset(row);
                          }}
                        >
                          Reset to default
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
      </section>

      {adding && (
        <CreateTeacherForm
          onClose={() => {
            setAdding(false);
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
        confirmLabel="Reset to default"
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
              toast.show({
                kind: "success",
                message: `${result.message} ${confirmReset.fullName} must change it at the next login.`,
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
        The password of {confirmReset?.fullName} goes back to the default, and
        they must change it at the next login.
      </ConfirmDialog>
    </>
  );
}
