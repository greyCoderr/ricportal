import { Link, useParams } from "react-router";
import { NotFoundPage } from "../../../app/pages/NotFoundPage";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Tabs } from "../../../components/ui";
import { ApiError } from "../../../lib/api";
import {
  ConferencesTab,
  HomeVisitsTab,
  ProgressTab,
} from "../components/ChildRecordTabs";
import { useStudent } from "../hooks";
import { studentCode } from "../student-list";

// A student's Child's Record for the Admin (Plan 4 D4): the Teacher's three
// tabs, read-only. The API already lets the Admin read any center (A-16).
export function AdminStudentRecordPage() {
  const studentId = Number(useParams().id);
  const student = useStudent(studentId);

  if (student.error instanceof ApiError && student.error.status === 404) {
    return <NotFoundPage />;
  }
  const data = student.data;

  return (
    <QueryBoundary query={student} errorTitle="Could not load this record.">
      {data !== undefined && (
        <>
          <p className="mb-2 text-13">
            <Link
              to="/admin/students"
              className="inline-flex min-h-11 items-center text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              Back to Enrolled Students
            </Link>
          </p>
          <PageHeader
            title={data.displayName}
            description={`Student ID: ${studentCode(data)}`}
          />
          <Tabs
            label="Child's Record"
            items={[
              {
                id: "conferences",
                label: "Conferences",
                content: (
                  <ConferencesTab
                    readOnly
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
                    readOnly
                    studentId={data.id}
                    childName={data.firstName}
                  />
                ),
              },
              {
                id: "progress",
                label: "Progress",
                content: (
                  <ProgressTab
                    readOnly
                    studentId={data.id}
                    childName={data.firstName}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </QueryBoundary>
  );
}
