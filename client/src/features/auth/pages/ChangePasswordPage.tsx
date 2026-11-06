import { changePasswordSchema } from "@ricportal/shared";
import { Navigate, useNavigate } from "react-router";
import { PasswordField } from "../../../components/form/fields";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { Banner, Button } from "../../../components/ui";
import { useZodForm } from "../../../lib/use-zod-form";
import { useChangePassword, useLogout, useSession } from "../hooks";

export function ChangePasswordPage() {
  const session = useSession();
  const navigate = useNavigate();
  const change = useChangePassword();
  const logout = useLogout();
  const form = useZodForm(changePasswordSchema, {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-surface px-4 py-6 text-text">
      <QueryBoundary query={session} errorTitle="Could not check your login.">
        {session.data === null ? (
          <Navigate to="/login" replace />
        ) : (
          <>
            <h1 className="text-24 font-semibold">Change your password</h1>
            <p className="mb-6 text-15 text-text-secondary">
              {session.data?.mustChangePassword === true
                ? "You are using a temporary password. Choose your own before you continue."
                : "Choose a new password for your account."}
            </p>
            <form
              noValidate
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit((data) => {
                change.mutate(data, {
                  onSuccess: () => {
                    void navigate("/", { replace: true });
                  },
                  onError: (error) => {
                    form.applyError(error);
                  },
                });
              })}
            >
              <PasswordField
                form={form}
                name="currentPassword"
                label="Current password"
                required
              />
              <PasswordField
                form={form}
                name="newPassword"
                label="New password"
                hint="At least 8 characters with a letter and a number."
                required
                autoComplete="new-password"
              />
              <PasswordField
                form={form}
                name="confirmPassword"
                label="Confirm new password"
                required
                autoComplete="new-password"
              />
              {form.formError !== null && (
                <Banner tone="danger">{form.formError}</Banner>
              )}
              <Button type="submit" loading={change.isPending}>
                Change password
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  logout.mutate();
                }}
              >
                Log out
              </Button>
            </form>
          </>
        )}
      </QueryBoundary>
    </main>
  );
}
