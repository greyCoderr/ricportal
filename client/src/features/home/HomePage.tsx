import { useCurrentUser } from "../auth/components/guards";
import { AdminDashboardPage } from "../dashboard/pages/AdminDashboardPage";
import { MySchedulePage } from "../purchase/pages/MySchedulePage";
import { TeacherHomePage } from "./TeacherHomePage";

// Each role's home: the Parent's calendar (DEC-024), the Admin Dashboard and the
// Teacher Home (D10).
export function HomePage() {
  const user = useCurrentUser();
  if (user.role === "PARENT") {
    return <MySchedulePage />;
  }
  return user.role === "ADMIN" ? <AdminDashboardPage /> : <TeacherHomePage />;
}
