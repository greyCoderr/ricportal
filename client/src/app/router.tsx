import { createBrowserRouter } from "react-router";
import { CentersPage } from "../features/accounts/pages/CentersPage";
import { ParentsPage } from "../features/accounts/pages/ParentsPage";
import { TeachersPage } from "../features/accounts/pages/TeachersPage";
import {
  RequireRole,
  RequireSession,
} from "../features/auth/components/guards";
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RequestSentPage, SignupPage } from "../features/auth/pages/SignupPage";
import { HealthPage } from "../features/health/pages/HealthPage";
import { HomePage } from "../features/home/HomePage";
import { StudentProfilePage } from "../features/students/pages/StudentProfilePage";
import { StudentsPage } from "../features/students/pages/StudentsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/request-sent", element: <RequestSentPage /> },
  { path: "/change-password", element: <ChangePasswordPage /> },
  { path: "/status", element: <HealthPage /> },
  {
    element: <RequireSession />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <RequireRole roles={["ADMIN"]} />,
        children: [
          { path: "/centers", element: <CentersPage /> },
          { path: "/teachers", element: <TeachersPage /> },
        ],
      },
      {
        element: <RequireRole roles={["TEACHER"]} />,
        children: [
          { path: "/parents", element: <ParentsPage /> },
          { path: "/students", element: <StudentsPage /> },
          { path: "/students/:id", element: <StudentProfilePage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
