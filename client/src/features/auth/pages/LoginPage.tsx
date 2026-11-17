import { loginSchema } from "@ricportal/shared";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import loginIcon from "../../../assets/icon-login.png";
import loginPhoneArt from "../../../assets/login-phone-art.svg";
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
// a username, with no forgot-password link and no terms box (DEC-034). Sizes
// and colors follow the two frames through the --login-* tokens (Plan 5 J2).
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
    <div className="ric-login grid min-h-dvh bg-surface text-text lg:grid-cols-[1fr_42%]">
      <div className="relative flex min-w-0 flex-col overflow-hidden px-4 py-5 lg:px-8">
        {/* Phones: the dark shape of 393:1106, placed as in the 375 x 734 frame. */}
        <img
          src={loginPhoneArt}
          alt=""
          className="pointer-events-none absolute top-[-11.72%] left-[-17.46%] h-[120.2%] w-[134.92%] max-w-none lg:hidden"
        />
        <img
          src={loginWaves}
          alt=""
          className="pointer-events-none absolute top-0 left-0 hidden h-full w-full object-cover object-left-top lg:block"
        />
        <div className="relative flex flex-col items-center gap-1 text-center lg:flex-row lg:justify-center lg:gap-3 lg:text-left">
          <img
            src={emblem}
            alt="Rural Improvement Club emblem"
            className="size-(--login-emblem) shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="pl-[0.64em] text-(length:--login-brand) leading-tight font-bold tracking-[0.64em] text-primary lg:pl-0 lg:tracking-[0.22em]">
              RICPORTAL
            </p>
            <p className="text-(length:--login-line) leading-snug font-semibold">
              Rural Improvement Club Portal
            </p>
            <p className="text-(length:--login-line) leading-snug font-semibold">
              Libmanan, Camarines Sur
            </p>
          </div>
        </div>

        <main className="relative mt-10 flex w-full flex-1 flex-col lg:mt-8">
          {/* On the dark ground the title uses the lighter red: Figma's red is
              2.9:1 there, under the 3:1 a large title needs. */}
          <h1 className="text-(length:--login-title) leading-tight font-semibold text-nav-selected lg:text-text">
            Welcome Back
          </h1>
          <p className="mb-10 text-(length:--login-sub) font-semibold tracking-label text-primary-contrast lg:mb-8 lg:text-text-secondary">
            Please log in to continue to your account
          </p>

          {/* Figma: the fields are 479 of 1280 px wide on a desktop (Plan 3 D2)
              and 266 of 375 px on a phone. */}
          <div className="mx-auto flex w-[71vw] max-w-full flex-col lg:w-[calc(479*var(--login-u))]">
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
                placeholder="ENTER YOUR USERNAME"
                fieldSize="login"
              />
              <PasswordField
                form={form}
                name="password"
                label="Password"
                placeholder="ENTER YOUR PASSWORD"
                fieldSize="login"
              />
              {form.formError !== null && (
                <div className="rounded-control bg-surface">
                  <Banner tone="danger">{form.formError}</Banner>
                </div>
              )}
              <Button
                type="submit"
                loading={login.isPending}
                className="ric-login-action mt-2 border border-border"
              >
                Log in
                <img src={loginIcon} alt="" className="size-[1.25em]" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 bg-primary-contrast lg:bg-border" />
              <span className="text-(length:--login-alt) tracking-label">
                or
              </span>
              <span className="h-px flex-1 bg-primary-contrast lg:bg-border" />
            </div>
            <Link
              to="/signup"
              className="ric-login-action inline-flex items-center justify-center rounded-control border border-primary-contrast tracking-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text lg:border-border lg:bg-surface"
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
