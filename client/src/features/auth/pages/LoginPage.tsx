import { loginSchema } from "@ricportal/shared";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { PasswordField, TextField } from "../../../components/form/fields";
import { Banner, Button } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useLogin, useSession } from "../hooks";

// Only a path inside this site may be the return target.
export function safeReturnPath(from: string | null): string {
  if (from === null || !from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }
  return from;
}

// Login (Figma 241:1732, S-P1-01). The frame's email field is a username, and
// its forgot-password link, terms box, stock photo and emblem are left out
// (DEC-034).
export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const login = useLogin();
  const form = useZodForm(loginSchema, { username: "", password: "" });
  const target = safeReturnPath(params.get("from"));

  if (session.data !== null && session.data !== undefined) {
    return <Navigate to={target} replace />;
  }

  return (
    <div className="grid min-h-screen bg-surface text-text md:grid-cols-[1fr_42%]">
      <div className="flex flex-col px-4 py-6 md:px-16">
        <p className="text-24 font-bold tracking-[0.22em] text-primary md:text-42">
          RICPORTAL
        </p>
        <p className="text-16 font-semibold md:text-24">
          Rural Improvement Club Portal
        </p>
        <p className="text-16 font-semibold md:text-24">
          Libmanan, Camarines Sur
        </p>

        <main className="mt-8 flex w-full max-w-[480px] flex-1 flex-col">
          <h1 className="text-24 font-semibold md:text-48">Welcome Back</h1>
          <p className="mb-6 text-15 font-semibold tracking-label text-text-secondary md:text-18">
            Please log in to continue to your account
          </p>

          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => {
              login.mutate(data, {
                onSuccess: () => {
                  void navigate(target, { replace: true });
                },
                onError: (error) => {
                  form.applyError(error);
                },
              });
            })}
          >
            <TextField
              form={form}
              name="username"
              label="Username"
              autoComplete="username"
              placeholder="Enter your username"
            />
            <PasswordField form={form} name="password" label="Password" />
            {form.formError !== null && (
              <Banner tone="danger">{form.formError}</Banner>
            )}
            <Button type="submit" loading={login.isPending} icon="log-out">
              Log in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-15 tracking-label">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Link
            to="/signup"
            className="inline-flex h-11 items-center justify-center rounded-control border border-border-subtle bg-surface text-15 tracking-label hover:border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            Sign up
          </Link>
        </main>

        <p className="mt-8 text-10 tracking-label">
          © 2026 RICPortal, Rural Improvement Club.
        </p>
      </div>
      <div aria-hidden="true" className="hidden bg-nav md:block" />
    </div>
  );
}
