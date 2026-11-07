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
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { RequestSentPage, SignupPage } from "../features/auth/pages/SignupPage";
import { HealthPage } from "../features/health/pages/HealthPage";
import { HomePage } from "../features/home/HomePage";
import { CalendarPage } from "../features/calendar/pages/CalendarPage";
import { MenuImportsPage } from "../features/menu/pages/MenuImportsPage";
import { AdminFeedbackPage } from "../features/reports/pages/AdminFeedbackPage";
import { ReportDetailPage } from "../features/reports/pages/ReportDetailPage";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { StudentFormPage } from "../features/students/pages/StudentFormPage";
import { StudentProfilePage } from "../features/students/pages/StudentProfilePage";
import { StudentsPage } from "../features/students/pages/StudentsPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
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
      { path: "/profile", element: <ProfilePage /> },
      {
        element: <RequireRole roles={["ADMIN"]} />,
        children: [
          { path: "/centers", element: <CentersPage /> },
          { path: "/teachers", element: <TeachersPage /> },
          { path: "/menu-imports", element: <MenuImportsPage /> },
        ],
      },
      {
        element: <RequireRole roles={["ADMIN", "TEACHER"]} />,
        children: [
          { path: "/calendar", element: <CalendarPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/reports/:id", element: <ReportDetailPage /> },
        ],
      },
      {
        element: <RequireRole roles={["TEACHER"]} />,
        children: [
          { path: "/parents", element: <ParentsPage /> },
          { path: "/students", element: <StudentsPage /> },
          { path: "/students/new", element: <StudentFormPage /> },
          { path: "/students/:id", element: <StudentProfilePage /> },
          { path: "/students/:id/edit", element: <StudentFormPage /> },
          {
            path: "/submit-report",
            element: <ComingSoonPage title="Submit Report" />,
          },
          { path: "/admin-feedback", element: <AdminFeedbackPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
