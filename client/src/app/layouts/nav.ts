import type { Role } from "@ricportal/shared";
import calendarIcon from "../../assets/nav-calendar.png";
import feedbackIcon from "../../assets/nav-feedback.png";
import parentRequestsIcon from "../../assets/nav-form.png";
import homeIcon from "../../assets/nav-home.png";
import profileIcon from "../../assets/nav-profile.png";
import reportStatusIcon from "../../assets/nav-report-status.png";
import studentsIcon from "../../assets/nav-students.png";
import submitReportIcon from "../../assets/nav-submit-report.png";

// Icons are the client's images (Figma 166:910). They sit beside their label,
// so they are decorative and carry an empty alt.
export type NavItem = { to: string; label: string; icon: string };

export const LOGOUT_LABEL = "LOGOUT";

const CALENDAR: NavItem = {
  to: "/calendar",
  label: "CALENDAR",
  icon: calendarIcon,
};
const PROFILE: NavItem = {
  to: "/profile",
  label: "PROFILE",
  icon: profileIcon,
};

// Exact labels and order from D10 (docs/POLISH_PLAN.md, DEC-037).
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/", label: "DASHBOARD", icon: homeIcon },
    CALENDAR,
    { to: "/reports", label: "REPORTS", icon: reportStatusIcon },
    { to: "/teachers", label: "RIC TEACHERS", icon: studentsIcon },
    PROFILE,
  ],
  TEACHER: [
    { to: "/", label: "HOME", icon: homeIcon },
    { to: "/students", label: "ENROLLED STUDENTS", icon: studentsIcon },
    CALENDAR,
    // Figma has no separate export for this icon, so it shares the form icon.
    { to: "/child-records", label: "CHILD'S RECORD", icon: parentRequestsIcon },
    { to: "/submit-report", label: "SUBMIT REPORT", icon: submitReportIcon },
    { to: "/reports", label: "REPORT STATUS", icon: reportStatusIcon },
    { to: "/admin-feedback", label: "ADMIN FEEDBACK", icon: feedbackIcon },
    { to: "/parents", label: "PARENT REQUESTS", icon: parentRequestsIcon },
    PROFILE,
  ],
  // The Parent home is the calendar (DEC-024).
  PARENT: [{ ...CALENDAR, to: "/" }, PROFILE],
};

// Pages the demo still needs but D10 leaves out of the menu. They are linked
// from the home page so they stay reachable (DEC-037).
export const EXTRA_LINKS_BY_ROLE: Record<
  Role,
  { to: string; label: string }[]
> = {
  ADMIN: [
    { to: "/centers", label: "Centers" },
    { to: "/menu-imports", label: "Menu Imports" },
  ],
  TEACHER: [],
  PARENT: [],
};
