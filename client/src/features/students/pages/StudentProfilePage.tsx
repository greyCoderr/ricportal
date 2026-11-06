import type { StudentDto } from "@ricportal/shared";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { NotFoundPage } from "../../../app/pages/NotFoundPage";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import { Banner, Button, ConfirmDialog } from "../../../components/ui";
import { Tabs } from "../../../components/ui/Tabs";
import { ApiError } from "../../../lib/api";
import { ConferencesTab, HomeVisitsTab } from "../components/ChildRecordTabs";
import { StudentForm } from "../components/StudentForm";
import { useSetStudentArchived, useStudent } from "../hooks";

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <dt className="text-13 text-text-secondary">{label}</dt>
      <dd className="text-16">{value === null ? "None" : value}</dd>
    </div>
  );
}

function ProfileFacts({ student }: { student: StudentDto }) {
  return (
    <>
      {student.ageWarning && (
        <div className="mb-3">
          <Banner tone="warning">
            {student.firstName} is {student.age} years old. Most children here
            are 2 to 4, so this child counts in the Other row.
          </Banner>
        </div>
      )}
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Age" value={student.age} />
        <Fact label="Sex" value={student.gender === "M" ? "Male" : "Female"} />
        <Fact label="Date of birth" value={student.birthdate} />
        <Fact label="Weight" value={`${student.weightKg} kg`} />
        <Fact label="Height" value={`${student.heightCm} cm`} />
        <Fact label="Parent or guardian" value={student.parentGuardianName} />
        <Fact label="Date enrolled" value={student.enrolledOn} />
        <Fact label="School year" value={student.schoolYear} />
        <Fact label="Birth order" value={student.birthOrder} />
        <Fact label="No. of siblings" value={student.numberOfSiblings} />
        <Fact label="Religion" value={student.religion} />
        <Fact label="Ethnicity" value={student.ethnicity} />
      </dl>
    </>
  );
}

// Child's Record. The Progress tab is cut for the demo; its API stays
// (docs/SPRINT_SHORTCUTS.md).
export function StudentProfilePage() {
  const { id } = useParams();
  const studentId = Number(id);
  const student = useStudent(studentId);
  const archive = useSetStudentArchived();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (student.error instanceof ApiError && student.error.status === 404) {
    return <NotFoundPage />;
  }

  const data = student.data;
  const isArchived = data?.status === "ARCHIVED";

  return (
    <QueryBoundary query={student} errorTitle="Could not load this student.">
      {data !== undefined && (
        <>
          <p className="mb-2 text-13">
            <Link
              to="/students"
              className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              Back to Enrolled Students
            </Link>
          </p>
          <PageHeader
            title={data.displayName}
            description={isArchived ? "Archived" : "Child's Record"}
            actions={
              data.isEditable ? (
                <>
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
                    onClick={() => {
                      setConfirming(true);
                    }}
                  >
                    {isArchived ? "Restore" : "Archive"}
                  </Button>
                </>
              ) : undefined
            }
          />
          <Tabs
            label="Child's Record"
            items={[
              {
                id: "profile",
                label: "Profile",
                content: <ProfileFacts student={data} />,
              },
              {
                id: "conferences",
                label: "One-on-One Conferences",
                content: (
                  <ConferencesTab
                    studentId={data.id}
                    childName={data.firstName}
                  />
                ),
              },
              {
                id: "visits",
                label: "Home Visits",
                content: (
                  <HomeVisitsTab
                    studentId={data.id}
                    childName={data.firstName}
                  />
                ),
              },
            ]}
          />
          {editing && (
            <StudentForm
              student={data}
              onClose={() => {
                setEditing(false);
              }}
            />
          )}
          <ConfirmDialog
            open={confirming}
            title={isArchived ? "Restore this child?" : "Archive this child?"}
            confirmLabel={isArchived ? "Restore" : "Archive"}
            loading={archive.isPending}
            onCancel={() => {
              setConfirming(false);
            }}
            onConfirm={() => {
              archive.mutate(
                { id: data.id, archived: !isArchived },
                {
                  onSettled: () => {
                    setConfirming(false);
                  },
                  onError: (error) => {
                    toast.show({ kind: "error", message: error.message });
                  },
                },
              );
            }}
          >
            {isArchived
              ? `${data.firstName} goes back on the active list.`
              : `${data.firstName} leaves the active list and the Enrollment Form. Nothing is deleted.`}
          </ConfirmDialog>
        </>
      )}
    </QueryBoundary>
  );
}
