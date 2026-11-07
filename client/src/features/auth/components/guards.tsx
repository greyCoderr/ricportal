import type { Role } from "@ricportal/shared";
import { Navigate, Outlet, useLocation } from "react-router";
import { ForbiddenPage } from "../../../app/pages/ForbiddenPage";
import { AppShell } from "../../../app/layouts/AppShell";
import { QueryBoundary } from "../../../components/QueryBoundary";
import { useLogout, useSession } from "../hooks";

// Everything behind the login. No session goes to the login page with the
// return path; a forced password change blocks everything else (P1-T13).
export function RequireSession() {
  const session = useSession();
  const location = useLocation();
  const logout = useLogout();

  return (
    <QueryBoundary query={session} errorTitle="Could not check your login.">
      {session.data === null || session.data === undefined ? (
        <Navigate
          to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}
          replace
        />
      ) : session.data.mustChangePassword ? (
        <Navigate to="/change-password" replace />
      ) : (
        <AppShell
          user={{
            fullName: session.data.fullName,
            role: session.data.role,
            centerName: session.data.centerName,
          }}
          onLogout={() => {
            logout.mutate();
          }}
        >
          <Outlet />
        </AppShell>
      )}
    </QueryBoundary>
  );
}

// A typed URL to a page of another role shows the 403 page.
export function RequireRole({ roles }: { roles: Role[] }) {
  const session = useSession();
  if (session.data === null || session.data === undefined) {
    return null;
  }
  return roles.includes(session.data.role) ? <Outlet /> : <ForbiddenPage />;
}

export function useCurrentUser() {
  const session = useSession();
  if (session.data === null || session.data === undefined) {
    throw new Error("useCurrentUser must be used behind RequireSession");
  }
  return session.data;
}
