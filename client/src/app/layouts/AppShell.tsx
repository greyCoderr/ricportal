import type { Role } from "@ricportal/shared";
import { useCallback, useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import avatar from "../../assets/avatar-placeholder.png";
import logoutIcon from "../../assets/nav-logout.png";
import emblem from "../../assets/ric-emblem.png";
import { Icon } from "../../components/ui";
import { useNativeDialog } from "../../components/ui/useNativeDialog";
import { LABELS } from "../../lib/labels";
import { AppFooter } from "./AppFooter";
import { LOGOUT_LABEL, NAV_BY_ROLE } from "./nav";

export type ShellUser = {
  fullName: string;
  role: Role;
  centerName?: string | null | undefined;
};

type AppShellProps = {
  user: ShellUser;
  onLogout: () => void;
  children: ReactNode;
};

const EMBLEM_ALT = "Rural Improvement Club emblem";
const NAV_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text";

function roleLine(user: ShellUser): string {
  if (user.role === "ADMIN") {
    return LABELS.admin;
  }
  const label = user.role === "TEACHER" ? LABELS.teacher : LABELS.parent;
  return user.centerName ? `${label}, ${user.centerName}` : label;
}

// The Admin frames center a large emblem and fill the selected item in red
// (267:9689). The Teacher frames use a small emblem and a pink item with a red
// strip (166:910). A Parent has no frame, so it follows the Teacher.
function SidebarBrand({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return (
      <div className="flex shrink-0 flex-col items-center border-b border-nav-text px-3.5 py-5 text-center text-nav-text">
        <img
          src={emblem}
          alt={EMBLEM_ALT}
          className="size-[124px] rounded-full object-cover"
        />
        <p className="mt-2 text-24 tracking-label">
          <span className="text-primary">RIC</span>Portal
        </p>
        <p className="text-12 tracking-label">Rural Improvement Club</p>
        <p className="text-12 tracking-label">Libmanan, Camarines Sur</p>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-primary py-5 pr-1 pl-6 text-nav-text">
      <img
        src={emblem}
        alt={EMBLEM_ALT}
        className="size-[54px] shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="text-20 tracking-label">
          <span className="text-primary">RIC</span>Portal
        </p>
        <p className="text-12 tracking-label whitespace-nowrap">
          Rural Improvement Club
        </p>
        <p className="text-12 tracking-label whitespace-nowrap">
          Libmanan, Camarines Sur
        </p>
      </div>
    </div>
  );
}

function itemClass(role: Role, isActive: boolean): string {
  const base = `flex h-[53px] shrink-0 items-center gap-3 rounded-card px-3 text-left tracking-label whitespace-nowrap ${NAV_FOCUS}`;
  const weight =
    role === "ADMIN" ? "text-15 font-medium" : "text-15 font-light";
  if (!isActive) {
    return `${base} ${weight} text-nav-text`;
  }
  return role === "ADMIN"
    ? `${base} ${weight} bg-primary text-primary-contrast`
    : `${base} ${weight} border-l-8 border-primary bg-nav-selected pl-1 text-nav-selected-text`;
}

function SidebarContent({
  user,
  onLogout,
  onNavigate,
}: {
  user: ShellUser;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  return (
    <>
      <SidebarBrand role={user.role} />
      <nav
        aria-label="Main"
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3.5"
      >
        {NAV_BY_ROLE[user.role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) => itemClass(user.role, isActive)}
          >
            {({ isActive }) => (
              <>
                <img
                  src={item.icon}
                  alt=""
                  // The icons are white; black on the pink item (DEC-023).
                  className={`size-6 shrink-0 ${
                    isActive && user.role !== "ADMIN" ? "brightness-0" : ""
                  }`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div
        data-testid="sidebar-logout"
        className="mt-auto shrink-0 border-t border-primary p-3.5"
      >
        <button
          type="button"
          onClick={onLogout}
          className={`w-full ${itemClass(user.role, false)}`}
        >
          <img src={logoutIcon} alt="" className="size-6 shrink-0" />
          {LOGOUT_LABEL}
        </button>
      </div>
    </>
  );
}

// Sidebar and top bar for every role (D10, D12). From 1024 px the sidebar is
// fixed to the viewport, its menu scrolls and logout stays at the bottom. Below
// 1024 px the menu is a drawer opened from the top bar (no Figma frame; DEC-037).
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);
  const drawerRef = useNativeDialog(menuOpen, closeMenu);

  return (
    <div className="flex bg-surface text-text">
      <aside
        data-testid="sidebar"
        className="sticky top-0 hidden h-dvh w-[290px] shrink-0 flex-col bg-nav lg:flex"
      >
        <SidebarContent
          user={user}
          onLogout={onLogout}
          onNavigate={closeMenu}
        />
      </aside>

      <dialog
        ref={drawerRef}
        aria-label="Menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
        className="m-0 h-dvh max-h-none w-[290px] max-w-[85vw] bg-nav text-nav-text backdrop:bg-overlay lg:hidden"
      >
        {menuOpen && (
          <div className="flex h-full flex-col">
            <SidebarContent
              user={user}
              onLogout={onLogout}
              onNavigate={closeMenu}
            />
          </div>
        )}
      </dialog>

      <div
        data-testid="page-column"
        className="flex min-h-dvh min-w-0 flex-1 flex-col"
      >
        <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 bg-nav px-4 text-nav-text shadow-header lg:min-h-[94px] lg:bg-header lg:text-text">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Menu"
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text lg:hidden"
          >
            <Icon name="menu" size={24} />
          </button>
          <img
            src={emblem}
            alt={EMBLEM_ALT}
            className="size-11 shrink-0 rounded-full object-cover lg:hidden"
          />
          <div className="min-w-0 lg:hidden">
            <p className="text-16 tracking-label">
              <span className="text-primary">RIC</span>Portal
            </p>
            <p className="truncate text-10 tracking-label">
              Rural Improvement Club, Libmanan, Camarines Sur
            </p>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <img
              src={avatar}
              alt=""
              className="size-11 shrink-0 rounded-full border-2 border-accent bg-surface object-cover lg:size-[70px]"
            />
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-13 font-medium tracking-label lg:text-20">
                {user.fullName}
              </p>
              <p className="truncate text-12 font-light tracking-label">
                {roleLine(user)}
              </p>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
        <AppFooter role={user.role} />
      </div>
    </div>
  );
}
