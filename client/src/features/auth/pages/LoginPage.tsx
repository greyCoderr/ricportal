import { loginSchema } from "@ricportal/shared";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import loginIcon from "../../../assets/icon-login.png";
import loginPhoto from "../../../assets/login-photo.jpg";
import loginWaves from "../../../assets/login-waves.png";
import emblem from "../../../assets/ric-emblem.png";
import { COPYRIGHT } from "../../../app/layouts/AppFooter";
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

// Login (Figma 241:1732 on desktop, 393:1102 on phones; S-P1-01). The photo and
// emblem are back with the client's permission (DEC-037). The email field stays
// a username, with no forgot-password link and no terms box (DEC-034).
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
    <div className="grid min-h-dvh bg-surface text-text lg:grid-cols-[1fr_42%]">
      <div className="relative flex min-w-0 flex-col overflow-hidden px-4 py-5 lg:px-8">
        <img
          src={loginWaves}
          alt=""
          className="pointer-events-none absolute top-0 left-0 h-full w-full object-cover object-left-top"
        />
        <div className="relative flex flex-col items-center gap-3 text-center lg:flex-row lg:justify-center lg:text-left">
          <img
            src={emblem}
            alt="Rural Improvement Club emblem"
            className="size-[6.0625rem] shrink-0 rounded-full object-cover lg:size-[7.0625rem]"
          />
          <div>
            <p className="text-24 font-bold tracking-[0.22em] text-primary lg:text-42">
              RICPORTAL
            </p>
            <p className="text-15 font-semibold lg:text-24">
              Rural Improvement Club Portal
            </p>
            <p className="text-15 font-semibold lg:text-24">
              Libmanan, Camarines Sur
            </p>
          </div>
        </div>

        <main className="relative mt-8 flex w-full flex-1 flex-col">
          <h1 className="text-24 font-semibold lg:text-48">Welcome Back</h1>
          <p className="mb-8 text-13 font-semibold tracking-label text-text-secondary lg:text-18">
            Please log in to continue to your account
          </p>

          <div className="mx-auto flex w-full max-w-[30rem] flex-col">
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
              <Button type="submit" loading={login.isPending}>
                Log in
                <img src={loginIcon} alt="" className="size-5" />
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
          </div>
        </main>

        <p className="relative mt-8 text-center text-10 tracking-label">
          {COPYRIGHT}
        </p>
      </div>
      <div className="relative hidden min-h-0 lg:block">
        <img
          src={loginPhoto}
          alt="A teacher showing a globe to two children in a classroom"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-overlay" />
      </div>
    </div>
  );
}
