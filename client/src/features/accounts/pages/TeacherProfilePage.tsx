import type { TeacherDetailDto } from "@ricportal/shared";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { PageHeader } from "../../../components/PageHeader";
import { NOT_SET, ProfileCard } from "../../../components/ProfileCard";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import { Button, ConfirmDialog } from "../../../components/ui";
import { formatDate, formatInstantDate } from "../../../lib/format";
import { userCode } from "../../../lib/user-code";
import { EditTeacherForm } from "../components/EditTeacherForm";
import { AccountStatusBadge } from "../components/StatusBadges";
import { StatusToggle } from "../components/StatusToggle";
import {
  useResetTeacherPassword,
  useTeacher,
  useUpdateTeacher,
} from "../hooks";

function TeacherDetails({ teacher }: { teacher: TeacherDetailDto }) {
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const update = useUpdateTeacher();
  const reset = useResetTeacherPassword();
  const toast = useToast();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusToggle
          name={teacher.fullName}
          status={teacher.status}
          disabled={update.isPending}
          onToggle={() => {
            update.mutate(
              {
                id: teacher.id,
                patch: {
                  status: teacher.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                },
              },
              {
                onError: (error) => {
                  toast.show({ kind: "error", message: error.message });
                },
              },
            );
          }}
        />
        <Button
          variant="secondary"
          icon="pencil"
          onClick={() => {
            setEditing(true);
          }}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          icon="refresh-cw"
          onClick={() => {
            setConfirmReset(true);
          }}
        >
          Reset to default password
        </Button>
      </div>

      <ProfileCard
        name={teacher.fullName}
        badge={<AccountStatusBadge status={teacher.status} />}
        contacts={[
          teacher.email ?? "No email yet",
          teacher.mobile ?? "No contact number yet",
          teacher.address ?? "No address yet",
        ]}
        columns={[
          [
            { label: "Teacher ID", value: userCode("TEACHER", teacher.id) },
            {
              label: "Date Registered",
              value: formatInstantDate(teacher.createdAt),
            },
            { label: "Barangay", value: teacher.centerName ?? NOT_SET },
          ],
          [
            { label: "Sex", value: teacher.sex ?? NOT_SET },
            {
              label: "BirthDate",
              value:
                teacher.birthDate === null
                  ? NOT_SET
                  : formatDate(teacher.birthDate),
            },
            { label: "Qualification", value: teacher.qualification ?? NOT_SET },
          ],
          [
            { label: "Username", value: teacher.username },
            { label: "Position", value: teacher.position ?? NOT_SET },
            {
              label: "Last Login",
              value:
                teacher.lastLoginAt === null
                  ? "Never"
                  : formatInstantDate(teacher.lastLoginAt),
            },
          ],
        ]}
      />

      {editing && (
        <EditTeacherForm
          teacher={teacher}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}
      <ConfirmDialog
        open={confirmReset}
        title="Reset this password?"
        confirmLabel="Reset to default"
        loading={reset.isPending}
        onCancel={() => {
          setConfirmReset(false);
        }}
        onConfirm={() => {
          reset.mutate(teacher.id, {
            onSuccess: (result) => {
              toast.show({
                kind: "success",
                message: `${result.message} ${teacher.fullName} must change it at the next login.`,
              });
              setConfirmReset(false);
            },
            onError: (error) => {
              setConfirmReset(false);
              toast.show({ kind: "error", message: error.message });
            },
          });
        }}
      >
        The password of {teacher.fullName} goes back to the default, and they
        must change it at the next login.
      </ConfirmDialog>
    </>
  );
}

// The Admin's View Profile for a Teacher (D8). Figma has no teacher frame for the
// Admin, so this follows the Profile layout 88:695 (Developer-designed).
export function TeacherProfilePage() {
  const id = Number(useParams().id);
  const teacher = useTeacher(id);
  return (
    <>
      <PageHeader
        title="RIC Teacher Profile"
        actions={
          <Link
            to="/teachers"
            className="inline-flex min-h-11 items-center text-13 text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            Back to RIC Teachers
          </Link>
        }
      />
      <QueryBoundary query={teacher} errorTitle="Could not load this profile.">
        {teacher.data !== undefined && (
          <TeacherDetails teacher={teacher.data} />
        )}
      </QueryBoundary>
    </>
  );
}
