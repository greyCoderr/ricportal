import type { Role } from "@ricportal/shared";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import { Icon } from "../../components/ui";
import { LABELS } from "../../lib/labels";
import { NAV_BY_ROLE } from "./nav";

export type ShellUser = {
  fullName: string;
  role: Exclude<Role, "PARENT">;
  centerName?: string | null | undefined;
};

type AppShellProps = {
  user: ShellUser;
  onLogout: () => void;
  children: ReactNode;
};

const NAV_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text";

function roleLine(user: ShellUser): string {
  if (user.role === "ADMIN") {
    return LABELS.admin;
  }
  return user.centerName
    ? `${LABELS.teacher}, ${user.centerName}`
    : LABELS.teacher;
}

// Sidebar and top bar for Admin and Teacher (Figma 166:910, 258:5454). Under
// 768 px the sidebar opens from the menu button.
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-text md:flex">
      <aside
        className={`w-full shrink-0 flex-col bg-nav p-3.5 md:flex md:min-h-screen md:w-[290px] ${
          menuOpen ? "flex" : "hidden"
        }`}
      >
        <nav aria-label="Main" className="flex flex-col gap-2">
          {NAV_BY_ROLE[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => {
                setMenuOpen(false);
              }}
              className={({ isActive }) =>
                `flex h-[53px] items-center gap-3 rounded-card px-3 text-16 font-light tracking-label ${NAV_FOCUS} ${
                  isActive
                    ? "border-l-8 border-primary bg-nav-selected text-nav-selected-text"
                    : "text-nav-text"
                }`
              }
            >
              <Icon name={item.icon} size={24} className="shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={onLogout}
          className={`mt-6 flex h-[53px] items-center gap-3 rounded-card px-3 text-left text-16 font-light tracking-label text-nav-text md:mt-auto ${NAV_FOCUS}`}
        >
          <Icon name="log-out" size={24} className="shrink-0" />
          Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 bg-header px-4 shadow-header">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Menu"
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
            className="inline-flex size-11 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text md:hidden"
          >
            <Icon name="menu" size={24} />
          </button>
          <p className="text-16 font-semibold text-primary">{LABELS.appName}</p>
          <div className="ml-auto text-right">
            <p className="text-13 font-medium">{user.fullName}</p>
            <p className="text-12 text-text-secondary">{roleLine(user)}</p>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
