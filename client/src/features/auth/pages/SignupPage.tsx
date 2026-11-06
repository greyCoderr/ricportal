import { parentSignupSchema } from "@ricportal/shared";
import { useEffect, useRef } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import {
  PasswordField,
  SelectField,
  TextField,
} from "../../../components/form/fields";
import { Banner, Button, ErrorState } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useParentSignup, usePublicCenters } from "../hooks";

const LOGIN_LINK =
  "text-15 font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

// S-P1-02 (docs/ui-specs/parent-screens.md). The center is a native select for
// now; a searchable one is a BACKLOG option (DEC-028).
export function SignupPage() {
  const navigate = useNavigate();
  const centers = usePublicCenters();
  const signup = useParentSignup();
  const form = useZodForm(parentSignupSchema, {
    fullName: "",
    username: "",
    mobile: "",
    centerId: "",
    childName: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-surface px-4 py-6 text-text">
      <h1 className="text-24 font-semibold">Create your parent account</h1>
      <p className="mb-6 text-15 text-text-secondary">
        Your RIC Teacher must approve your account before you can log in.
      </p>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          signup.mutate(
            { ...data, centerId: data.centerId },
            {
              onSuccess: (result) => {
                void navigate("/request-sent", {
                  state: { centerName: result.centerName },
                });
              },
              onError: (error) => {
                form.applyError(error);
              },
            },
          );
        })}
      >
        <TextField
          form={form}
          name="fullName"
          label="Full name"
          required
          autoComplete="name"
        />
        <TextField
          form={form}
          name="username"
          label="Username"
          required
          autoComplete="username"
        />
        <TextField
          form={form}
          name="mobile"
          label="Mobile number"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="09171234567"
        />
        {centers.isError ? (
          <ErrorState
            title="Could not load the RIC Children Centers."
            message={centers.error.message}
            onRetry={() => {
              void centers.refetch();
            }}
            retrying={centers.isFetching}
          />
        ) : (
          <SelectField
            form={form}
            name="centerId"
            label="RIC Children Center"
            required
            disabled={centers.isPending}
            placeholder={centers.isPending ? "Loading centers..." : "Select..."}
          >
            {centers.data?.map((center) => (
              <option key={center.id} value={String(center.id)}>
                {center.name}
              </option>
            ))}
          </SelectField>
        )}
        <TextField
          form={form}
          name="childName"
          label="Child's name (optional)"
        />
        <PasswordField
          form={form}
          name="password"
          label="Password"
          required
          autoComplete="new-password"
        />
        <PasswordField
          form={form}
          name="confirmPassword"
          label="Confirm password"
          required
          autoComplete="new-password"
        />
        {form.formError !== null && (
          <Banner tone="danger">{form.formError}</Banner>
        )}
        <Button type="submit" loading={signup.isPending}>
          Create account
        </Button>
      </form>
      <p className="mt-4">
        <Link to="/login" className={LOGIN_LINK}>
          Already have an account? Log in
        </Link>
      </p>
    </main>
  );
}

// S-P1-07. Opened without a sign-up result (a reload) it shows the login page.
export function RequestSentPage() {
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const state = location.state as { centerName?: unknown } | null;
  const centerName =
    typeof state?.centerName === "string" ? state.centerName : null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (centerName === null) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-start gap-3 bg-surface px-4 py-6 text-text">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-24 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        Request sent
      </h1>
      <p className="text-16">
        Your request was sent to the RIC Teacher of {centerName}. You can log in
        after your teacher approves it.
      </p>
      <Link
        to="/login"
        className="inline-flex h-11 items-center rounded-control bg-primary px-4 text-13 font-medium text-primary-contrast hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        Back to login
      </Link>
    </main>
  );
}
