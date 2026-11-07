import type { StudentDto, StudentStatus } from "@ricportal/shared";
import { manilaToday } from "@ricportal/shared";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useToast } from "../../../components/toast/ToastProvider";
import {
  Badge,
  Button,
  ConfirmDialog,
  DateInput,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Modal,
  Pagination,
  Select,
} from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { useCurrentUser } from "../../auth/components/guards";
import { enrollmentFormUrl } from "../api";
import {
  useSetStudentArchived,
  useStudents,
  useStudentSummary,
} from "../hooks";
import { earlierSchoolYears, studentCode, yearOf } from "../student-list";

function EnrollmentFormDialog({ onClose }: { onClose: () => void }) {
  const [dateStarted, setDateStarted] = useState(manilaToday());
  return (
    <Modal
      open
      onClose={onClose}
      title="Enrollment Form"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="download"
            onClick={() => {
              window.open(enrollmentFormUrl(dateStarted), "_blank", "noopener");
              onClose();
            }}
          >
            Open PDF
          </Button>
        </>
      }
    >
      <FormField
        label="Date Started"
        hint="The form lists the active children of the current school year."
      >
        {(field) => (
          <DateInput
            {...field}
            value={dateStarted}
            onValueChange={setDateStarted}
          />
        )}
      </FormField>
    </Modal>
  );
}

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return status === "ACTIVE" ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="warning">Archived</Badge>
  );
}

function RowActions({
  student,
  onArchive,
}: {
  student: StudentDto;
  onArchive: () => void;
}) {
  const navigate = useNavigate();
  if (!student.isEditable) {
    return null;
  }
  return (
    <div className="flex justify-end gap-1">
      <IconButton
        icon="pencil"
        label={`Edit ${student.displayName}`}
        onClick={() => {
          void navigate(`/students/${String(student.id)}/edit`);
        }}
      />
      <IconButton
        icon={student.status === "ACTIVE" ? "trash-2" : "refresh-cw"}
        label={`${student.status === "ACTIVE" ? "Archive" : "Restore"} ${student.displayName}`}
        onClick={onArchive}
      />
    </div>
  );
}

function StudentName({ student }: { student: StudentDto }) {
  return (
    <Link
      to={`/students/${String(student.id)}`}
      className="inline-flex min-h-11 items-center font-medium text-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text lg:min-h-0"
    >
      {student.displayName}
    </Link>
  );
}

const TH = "px-3 py-2 text-left font-medium";
const TD = "border-b border-border-subtle px-3 py-1 compact:py-0";

// Student list (Figma 78:260). Rows with their numbers in order on the page; cards
// on phones (361:3405). Dates are numeric (D7).
function StudentRows({
  students,
  firstNumber,
  onArchive,
}: {
  students: StudentDto[];
  firstNumber: number;
  onArchive: (student: StudentDto) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block compact:overflow-visible">
        <table className="w-full border-collapse text-15 compact:text-12">
          <thead className="bg-header">
            <tr>
              <th scope="col" className={TH}>
                #
              </th>
              <th scope="col" className={TH}>
                Student ID
              </th>
              <th scope="col" className={TH}>
                Student name
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Age
              </th>
              <th scope="col" className={TH}>
                Sex
              </th>
              <th scope="col" className={TH}>
                Date Enrolled
              </th>
              <th scope="col" className={TH}>
                Status
              </th>
              <th scope="col" className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td className={`${TD} tabular-nums`}>{firstNumber + index}</td>
                <td className={`${TD} tabular-nums`}>{studentCode(student)}</td>
                <td className={TD}>
                  <StudentName student={student} />
                </td>
                <td className={`${TD} text-right tabular-nums`}>
                  {student.age}
                </td>
                <td className={TD}>{student.gender}</td>
                <td className={`${TD} tabular-nums`}>
                  {formatDate(student.enrolledOn)}
                </td>
                <td className={TD}>
                  <StudentStatusBadge status={student.status} />
                </td>
                <td className={TD}>
                  <RowActions
                    student={student}
                    onArchive={() => {
                      onArchive(student);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {students.map((student) => (
          <li
            key={student.id}
            className="rounded-control border border-border-subtle p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <StudentName student={student} />
              <StudentStatusBadge status={student.status} />
            </div>
            <p className="text-13 text-text-secondary tabular-nums">
              {studentCode(student)}, age {student.age}, {student.gender}
            </p>
            <p className="text-13 text-text-secondary tabular-nums">
              Enrolled {formatDate(student.enrolledOn)}
            </p>
            <RowActions
              student={student}
              onArchive={() => {
                onArchive(student);
              }}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function StudentsPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const center = user.centerName ?? "your center";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus>("ACTIVE");
  const [schoolYear, setSchoolYear] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [archiving, setArchiving] = useState<StudentDto | null>(null);
  const summary = useStudentSummary();
  const students = useStudents({ q: search.trim(), status, schoolYear, page });
  const archive = useSetStudentArchived();
  const currentYear = summary.data?.schoolYear;
  const shownYear = schoolYear ?? currentYear;
  const isArchived = archiving?.status === "ARCHIVED";
  const pageSize = students.data?.meta.pageSize ?? 20;
  const firstNumber = (page - 1) * pageSize + 1;

  return (
    <>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-24 font-semibold tracking-label text-accent lg:text-40">
            Enrolled Students
          </h1>
          <p className="text-13 tracking-label text-text-secondary">
            {center}, Libmanan, Camarines Sur
            {summary.data === undefined
              ? ""
              : `: ${String(summary.data.total)} active`}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-72">
            <FormField label="Search" hideLabel>
              {(field) => (
                <Input
                  {...field}
                  placeholder="Search student name"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              )}
            </FormField>
          </div>
          <Button
            icon="plus"
            onClick={() => {
              void navigate("/students/new");
            }}
          >
            Add Student
          </Button>
          <Button
            variant="secondary"
            icon="file-text"
            onClick={() => {
              setFormOpen(true);
            }}
          >
            Enrollment Form
          </Button>
        </div>
      </header>

      <section className="rounded-card border border-border-subtle p-3 shadow-panel lg:p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-18 font-semibold tracking-label">
            {shownYear === undefined
              ? "Student List"
              : `Student List for ${yearOf(shownYear)}`}
          </h2>
          <div className="w-40">
            <FormField label="Status">
              {(field) => (
                <Select
                  {...field}
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as StudentStatus);
                    setPage(1);
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              )}
            </FormField>
          </div>
        </div>
        <QueryBoundary
          query={students}
          errorTitle={`Could not load the students of ${center}.`}
        >
          {students.data?.data.length === 0 ? (
            <EmptyState
              title={
                search.trim() !== ""
                  ? `No student at ${center} matches "${search.trim()}".`
                  : status === "ACTIVE"
                    ? `No students enrolled at ${center} yet.`
                    : `No archived students at ${center}.`
              }
            />
          ) : (
            <>
              <StudentRows
                students={students.data?.data ?? []}
                firstNumber={firstNumber}
                onArchive={setArchiving}
              />
              <Pagination
                page={students.data?.meta.page ?? page}
                pageSize={pageSize}
                total={students.data?.meta.total ?? 0}
                onPageChange={setPage}
              />
            </>
          )}
        </QueryBoundary>
      </section>

      {currentYear !== undefined && (
        <ul className="mt-4 flex flex-col gap-3">
          {[
            ...(schoolYear === undefined ? [] : [currentYear]),
            ...earlierSchoolYears(currentYear).filter(
              (year) => year !== schoolYear,
            ),
          ].map((year) => (
            <li
              key={year}
              className="flex items-center justify-between gap-3 rounded-card border border-border-subtle px-4 py-3 shadow-panel"
            >
              <span className="text-15 font-semibold tracking-label">
                Student List for {yearOf(year)}
              </span>
              <button
                type="button"
                aria-label={`View All, Student List for ${yearOf(year)}`}
                className="inline-flex min-h-11 items-center text-15 tracking-label text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                onClick={() => {
                  setSchoolYear(year === currentYear ? undefined : year);
                  setPage(1);
                }}
              >
                View All
              </button>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <EnrollmentFormDialog
          onClose={() => {
            setFormOpen(false);
          }}
        />
      )}
      <ConfirmDialog
        open={archiving !== null}
        title={isArchived ? "Restore this child?" : "Archive this child?"}
        confirmLabel={isArchived ? "Restore" : "Archive"}
        loading={archive.isPending}
        onCancel={() => {
          setArchiving(null);
        }}
        onConfirm={() => {
          if (archiving === null) return;
          archive.mutate(
            { id: archiving.id, archived: !isArchived },
            {
              onSettled: () => {
                setArchiving(null);
              },
              onError: (error) => {
                toast.show({ kind: "error", message: error.message });
              },
            },
          );
        }}
      >
        {isArchived
          ? `${archiving.firstName} goes back on the active list.`
          : `${archiving?.firstName ?? "This child"} leaves the active list and the Enrollment Form. Nothing is deleted.`}
      </ConfirmDialog>
    </>
  );
}
