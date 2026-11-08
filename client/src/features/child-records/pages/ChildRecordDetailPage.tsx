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
} from "../../students/components/ChildRecordTabs";
import { useStudent } from "../../students/hooks";
import { studentCode } from "../../students/student-list";

// One child's record, with the three tabs of D10.
export function ChildRecordDetailPage() {
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
              to="/child-records"
              className="inline-flex min-h-11 items-center text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              Back to Child&apos;s Record
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
              {
                id: "progress",
                label: "Progress",
                content: (
                  <ProgressTab studentId={data.id} childName={data.firstName} />
                ),
              },
            ]}
          />
        </>
      )}
    </QueryBoundary>
  );
}
