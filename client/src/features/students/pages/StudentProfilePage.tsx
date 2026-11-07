import type { ProfileExtra, StudentDto } from "@ricportal/shared";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { NotFoundPage } from "../../../app/pages/NotFoundPage";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import { Banner, Button, ConfirmDialog } from "../../../components/ui";
import { Tabs } from "../../../components/ui/Tabs";
import { ApiError } from "../../../lib/api";
import { formatDate, formatPeso } from "../../../lib/format";
import { ConferencesTab, HomeVisitsTab } from "../components/ChildRecordTabs";
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

const yesNo = (value: boolean | undefined) => (value === true ? "Yes" : null);

function joined(parts: (string | undefined)[]): string | null {
  const filled = parts.filter(
    (part): part is string => part !== undefined && part !== "",
  );
  return filled.length === 0 ? null : filled.join(", ");
}

// The extra fields of the form (D9). Only what was filled in is shown.
function ExtraFacts({ extra }: { extra: ProfileExtra }) {
  const facts: [string, string | null][] = [
    ["Nickname", extra.nickname ?? null],
    ["Jr/Sr", extra.suffix ?? null],
    ["Birth place", extra.birthPlace ?? null],
    [
      "Birth registered",
      extra.birthRegistered === "YES"
        ? "Yes"
        : extra.birthRegistered === "NO"
          ? "No"
          : null,
    ],
    [
      "Facility location",
      joined([
        extra.facilityLocation,
        extra.facilityBarangay,
        extra.facilityMunicipality,
        extra.facilityProvince,
        extra.facilityRegion,
      ]),
    ],
    [
      "Home address",
      joined([
        extra.homeStreet,
        extra.homeBarangay,
        extra.homeMunicipality,
        extra.homeProvince,
        extra.homeRegion,
      ]),
    ],
    [
      "Breastfed",
      extra.breastfed === true
        ? joined([
            "Yes",
            extra.breastfedMonths && `${extra.breastfedMonths} months`,
          ])
        : null,
    ],
    [
      "Supplemental feeding",
      extra.supplemental === true
        ? joined([
            "Yes",
            extra.supplementalDays && `${extra.supplementalDays} days`,
          ])
        : null,
    ],
    [
      "Food for School",
      extra.riceDistribution === true
        ? joined(["Yes", extra.riceKg && `${extra.riceKg} kg`])
        : null,
    ],
    ["Assessment of assistance", yesNo(extra.assistance)],
    [
      "Participation fee",
      extra.feePaid === true
        ? extra.feeAmount
          ? formatPeso(extra.feeAmount)
          : "Paid"
        : null,
    ],
    ["Accomplished by", extra.accomplishedBy ?? null],
    [
      "Date accomplished",
      extra.dateAccomplished ? formatDate(extra.dateAccomplished) : null,
    ],
    ["ECCD service provider", extra.providerName ?? null],
    ["Encoder ID", extra.encoderId ?? null],
  ];
  const shown = facts.filter(([, value]) => value !== null && value !== "");
  return (
    <div className="mt-6 flex flex-col gap-6">
      {shown.length > 0 && (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(([label, value]) => (
            <Fact key={label} label={label} value={value} />
          ))}
        </dl>
      )}
      {(extra.familyMembers?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 text-16 font-semibold">Family members</h2>
          <ul className="flex flex-col gap-2 text-15">
            {extra.familyMembers?.map((member, index) => (
              <li key={index}>
                {joined([
                  member.fullName,
                  member.relationship,
                  member.birthday && formatDate(member.birthday),
                  member.occupation,
                ])}
              </li>
            ))}
          </ul>
        </section>
      )}
      {(extra.disabilities?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 text-16 font-semibold">
            Disabilities or impairments
          </h2>
          <ul className="flex flex-col gap-2 text-15">
            {extra.disabilities?.map((row, index) => (
              <li key={index}>{joined([row.type, row.cause])}</li>
            ))}
          </ul>
        </section>
      )}
      {(extra.eccd?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 text-16 font-semibold">Past ECCD experience</h2>
          <ul className="flex flex-col gap-2 text-15">
            {extra.eccd?.map((row, index) => (
              <li key={index}>
                {joined([
                  row.serviceType,
                  row.service,
                  row.from && formatDate(row.from),
                  row.to && formatDate(row.to),
                ])}
              </li>
            ))}
          </ul>
        </section>
      )}
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
        <Fact label="Date of birth" value={formatDate(student.birthdate)} />
        <Fact label="Weight" value={`${student.weightKg} kg`} />
        <Fact label="Height" value={`${student.heightCm} cm`} />
        <Fact label="Parent or guardian" value={student.parentGuardianName} />
        <Fact label="Date enrolled" value={formatDate(student.enrolledOn)} />
        <Fact label="School year" value={student.schoolYear} />
        <Fact label="Birth order" value={student.birthOrder} />
        <Fact label="No. of siblings" value={student.numberOfSiblings} />
        <Fact label="Religion" value={student.religion} />
        <Fact label="Ethnicity" value={student.ethnicity} />
      </dl>
      {student.profileExtra !== null && (
        <ExtraFacts extra={student.profileExtra} />
      )}
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
  const navigate = useNavigate();
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
                      void navigate(`/students/${String(data.id)}/edit`);
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
