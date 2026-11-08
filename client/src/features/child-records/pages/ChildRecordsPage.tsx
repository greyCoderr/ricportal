import type { ChildRecordRowDto } from "@ricportal/shared";
import { useState } from "react";
import { Link } from "react-router";
import { QueryBoundary } from "../../../components/QueryBoundary";
import {
  Badge,
  EmptyState,
  FormField,
  Icon,
  Input,
  Pagination,
} from "../../../components/ui";
import { useCurrentUser } from "../../auth/components/guards";
import { studentCode } from "../../students/student-list";
import { useChildRecords } from "../hooks";

function ChildCard({ child }: { child: ChildRecordRowDto }) {
  return (
    <li className="flex min-w-0 items-start gap-3 rounded-control border border-border-subtle p-4 shadow-panel">
      <Icon name="user" size={28} className="shrink-0" />
      <div className="min-w-0 flex-1 text-13 tracking-label">
        <p className="font-medium break-words">{child.displayName}</p>
        <p className="tabular-nums">Student ID: {studentCode(child)}</p>
        <p className="flex flex-wrap gap-x-4">
          <span>Age: {child.age}</span>
          <span>Sex: {child.gender === "M" ? "Male" : "Female"}</span>
        </p>
        <p className="mt-1 flex flex-wrap gap-x-4 text-12 text-text-secondary tabular-nums">
          <span>Conferences: {child.records.conferences}</span>
          <span>Home Visits: {child.records.homeVisits}</span>
          <span>Progress: {child.records.progress}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Badge tone="success">Active</Badge>
        <Link
          to={`/child-records/${String(child.id)}`}
          aria-label={`View record of ${child.displayName}`}
          className="inline-flex min-h-11 items-center rounded-control border border-border-subtle px-3 text-12 tracking-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          View record &gt;
        </Link>
      </div>
    </li>
  );
}

// Child's Record (Figma 169:3189), with the record counts of D10. The frame's
// Grade has no data source.
export function ChildRecordsPage() {
  const user = useCurrentUser();
  const center = user.centerName ?? "your center";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = search.trim();
  const children = useChildRecords({ q, page });

  return (
    <>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-24 font-bold tracking-label lg:text-40">
            Child&apos;s Record
          </h1>
          <p className="text-13 tracking-label text-text-secondary">
            Detailed information and history of a student.
          </p>
        </div>
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
      </header>
      <QueryBoundary
        query={children}
        errorTitle={`Could not load the children of ${center}.`}
      >
        {children.data?.data.length === 0 ? (
          <EmptyState
            title={
              q === ""
                ? `No students enrolled at ${center} yet.`
                : `No student at ${center} matches "${q}".`
            }
          />
        ) : (
          <>
            <ul className="grid gap-4 lg:grid-cols-2">
              {children.data?.data.map((child) => (
                <ChildCard key={child.id} child={child} />
              ))}
            </ul>
            <Pagination
              page={children.data?.meta.page ?? page}
              pageSize={children.data?.meta.pageSize ?? 20}
              total={children.data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
