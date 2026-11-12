import { useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../../components/PageHeader";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  EmptyState,
  FormField,
  Input,
  Pagination,
  Select,
  Table,
} from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import { useCenters } from "../../accounts/hooks";
import { useStudents } from "../hooks";

const LINK =
  "inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text compact:min-h-6";

// Monitor Enrolled Students (Plan 4 D4): the Admin reads every center's active
// students, read-only, through the existing GET /api/students (A-16).
export function AdminStudentsPage() {
  const [centerId, setCenterId] = useState<number | undefined>(undefined);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const centers = useCenters({ page: 1, pageSize: 100 });
  const students = useStudents({
    q,
    status: "ACTIVE",
    centerId,
    page,
  });
  const centerNames = new Map(
    centers.data?.data.map((center) => [center.id, center.name]) ?? [],
  );
  const rows = students.data?.data ?? [];
  const first = ((students.data?.meta.page ?? 1) - 1) * 20;

  return (
    <>
      <p className="mb-2 text-13">
        <Link to="/" className={`${LINK} text-primary`}>
          Back to Dashboard
        </Link>
      </p>
      <PageHeader
        title="Enrolled Students"
        description="View and monitor student records by center."
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <FormField label="RIC Children Center">
            {(field) => (
              <Select
                {...field}
                value={centerId === undefined ? "" : String(centerId)}
                onChange={(event) => {
                  setCenterId(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  );
                  setPage(1);
                }}
              >
                <option value="">All centers</option>
                {centers.data?.data.map((center) => (
                  <option key={center.id} value={String(center.id)}>
                    {center.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
        <div className="w-full sm:w-72">
          <FormField label="Search student">
            {(field) => (
              <Input
                {...field}
                type="search"
                value={q}
                placeholder="Name"
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
              />
            )}
          </FormField>
        </div>
      </div>
      <QueryBoundary query={students} errorTitle="Could not load the students.">
        {rows.length === 0 ? (
          <EmptyState title="No students match." />
        ) : (
          <>
            <Table
              band
              cardsOnPhone
              caption="Enrolled Students"
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "number",
                  header: "#",
                  render: (row) => String(first + rows.indexOf(row) + 1),
                },
                {
                  key: "name",
                  header: "Student Name",
                  render: (row) => (
                    <Link
                      to={`/admin/students/${String(row.id)}`}
                      className={LINK}
                    >
                      {row.displayName}
                    </Link>
                  ),
                },
                {
                  key: "date",
                  header: "Date Enrolled",
                  render: (row) => formatDate(row.enrolledOn),
                },
                {
                  key: "age",
                  header: "Age",
                  align: "right",
                  render: (row) => String(row.age),
                },
                {
                  key: "center",
                  header: "Center",
                  render: (row) => centerNames.get(row.centerId) ?? "",
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
    </>
  );
}
