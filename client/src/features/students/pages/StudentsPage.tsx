import type { StudentStatus } from "@ricportal/shared";
import { manilaToday } from "@ricportal/shared";
import { useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Badge,
  Button,
  EmptyState,
  FormField,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
} from "../../../components/ui";
import { useCurrentUser } from "../../auth/components/guards";
import { enrollmentFormUrl } from "../api";
import { StudentForm } from "../components/StudentForm";
import { useStudents, useStudentSummary } from "../hooks";

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
          <Input
            {...field}
            type="date"
            value={dateStarted}
            onChange={(event) => {
              setDateStarted(event.target.value);
            }}
          />
        )}
      </FormField>
    </Modal>
  );
}

// Student list (Figma 78:260 "enrolled studs").
export function StudentsPage() {
  const user = useCurrentUser();
  const center = user.centerName ?? "your center";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus>("ACTIVE");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const students = useStudents({ q: search.trim(), status, page });
  const summary = useStudentSummary();

  return (
    <>
      <PageHeader
        title="Enrolled Students"
        description={
          summary.data === undefined
            ? center
            : `${center}, school year ${summary.data.schoolYear}: ${String(summary.data.total)} active`
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon="file-text"
              onClick={() => {
                setFormOpen(true);
              }}
            >
              Enrollment Form
            </Button>
            <Button
              icon="plus"
              onClick={() => {
                setAdding(true);
              }}
            >
              Add Student
            </Button>
          </>
        }
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <FormField label="Search">
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
            <Table
              caption={`Students of ${center}`}
              rows={students.data?.data ?? []}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  header: "Student name",
                  render: (row) => (
                    <Link
                      to={`/students/${String(row.id)}`}
                      className="font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                    >
                      {row.displayName}
                    </Link>
                  ),
                },
                {
                  key: "age",
                  header: "Age",
                  align: "right",
                  render: (row) => String(row.age),
                },
                { key: "sex", header: "Sex", render: (row) => row.gender },
                {
                  key: "enrolled",
                  header: "Date Enrolled",
                  render: (row) => row.enrolledOn,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) =>
                    row.status === "ACTIVE" ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="warning">Archived</Badge>
                    ),
                },
              ]}
            />
            <Pagination
              page={students.data?.meta.page ?? page}
              pageSize={students.data?.meta.pageSize ?? 20}
              total={students.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
      {adding && (
        <StudentForm
          student={null}
          onClose={() => {
            setAdding(false);
          }}
        />
      )}
      {formOpen && (
        <EnrollmentFormDialog
          onClose={() => {
            setFormOpen(false);
          }}
        />
      )}
    </>
  );
}
