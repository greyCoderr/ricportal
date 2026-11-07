import { useNavigate, useParams } from "react-router";
import { NotFoundPage } from "../../../app/pages/NotFoundPage";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { ApiError } from "../../../lib/api";
import { StudentForm } from "../components/StudentForm";
import { useStudent } from "../hooks";

function Heading({ title }: { title: string }) {
  return (
    <>
      <h1 className="text-24 font-semibold">{title}</h1>
      <p className="mb-4 text-15 tracking-label text-text-secondary">
        Please fill out all required information below.
      </p>
    </>
  );
}

function EditStudent({ id }: { id: number }) {
  const navigate = useNavigate();
  const student = useStudent(id);
  if (student.error instanceof ApiError && student.error.status === 404) {
    return <NotFoundPage />;
  }
  return (
    <QueryBoundary query={student} errorTitle="Could not load this student.">
      {student.data !== undefined && (
        <>
          <Heading title={`Edit ${student.data.displayName}`} />
          <StudentForm
            student={student.data}
            onClose={() => {
              void navigate(`/students/${String(id)}`);
            }}
          />
        </>
      )}
    </QueryBoundary>
  );
}

// The "add enroll" page (Figma 258:5447, D9).
export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (id !== undefined) {
    return <EditStudent id={Number(id)} />;
  }
  return (
    <>
      <Heading title="Add a student" />
      <StudentForm
        student={null}
        onClose={() => {
          void navigate("/students");
        }}
      />
    </>
  );
}
