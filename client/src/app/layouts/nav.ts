import type { Role } from "@ricportal/shared";
import type { IconName } from "../../components/ui";

export type NavItem = { to: string; label: string; icon: IconName };

// Labels from the Figma sidebar (166:910) where the screen exists there. Only
// the screens in the demo sprint scope are listed (docs/SPRINT_PLAN.md).
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/", label: "Home", icon: "house" },
    { to: "/centers", label: "Centers", icon: "map-pin" },
    { to: "/teachers", label: "RIC Teachers", icon: "users" },
    { to: "/menu-imports", label: "Menu Imports", icon: "upload" },
    { to: "/calendar", label: "Calendar", icon: "calendar-days" },
    { to: "/reports", label: "Reports", icon: "file-text" },
  ],
  TEACHER: [
    { to: "/", label: "Home", icon: "house" },
    { to: "/students", label: "Enrolled Students", icon: "users" },
    { to: "/calendar", label: "Calendar", icon: "calendar-days" },
    { to: "/assignments", label: "Assignments", icon: "pencil" },
    { to: "/parents", label: "Parent Requests", icon: "inbox" },
    { to: "/reports", label: "Report Status", icon: "file-text" },
  ],
  PARENT: [{ to: "/", label: "My Schedule", icon: "calendar-days" }],
};
