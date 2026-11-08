import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AppFooter } from "./AppFooter";
import { AppShell, type ShellUser } from "./AppShell";
import { EXTRA_LINKS_BY_ROLE, LOGOUT_LABEL, NAV_BY_ROLE } from "./nav";

function shell(role: ShellUser["role"], path = "/") {
  const onLogout = vi.fn();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell
        user={{ fullName: "Ana Cruz", role, centerName: "Sibujo" }}
        onLogout={onLogout}
      >
        <p>Page body</p>
      </AppShell>
    </MemoryRouter>,
  );
  return { onLogout };
}

const labels = (role: keyof typeof NAV_BY_ROLE) =>
  NAV_BY_ROLE[role].map((item) => item.label);

describe("role-aware navigation (D10)", () => {
  it("each role has the exact labels in the exact order", () => {
    expect(labels("ADMIN")).toEqual([
      "DASHBOARD",
      "CALENDAR",
      "REPORTS",
      "RIC TEACHERS",
      "PROFILE",
    ]);
    expect(labels("TEACHER")).toEqual([
      "HOME",
      "ENROLLED STUDENTS",
      "CALENDAR",
      "SUBMIT REPORT",
      "REPORT STATUS",
      "ADMIN FEEDBACK",
      "PARENT REQUESTS",
      "PROFILE",
    ]);
    expect(labels("PARENT")).toEqual(["CALENDAR", "PROFILE"]);
    expect(LOGOUT_LABEL).toBe("LOGOUT");
  });

  it("each role has its own paths", () => {
    const paths = (role: keyof typeof NAV_BY_ROLE) =>
      NAV_BY_ROLE[role].map((item) => item.to);
    expect(paths("ADMIN")).toContain("/teachers");
    expect(paths("TEACHER")).not.toContain("/teachers");
    expect(paths("TEACHER")).toContain("/parents");
    expect(paths("ADMIN")).not.toContain("/parents");
    expect(paths("PARENT")).toEqual(["/", "/profile"]);
  });

  it("pages left out of the D10 menu stay reachable from the home page", () => {
    const paths = EXTRA_LINKS_BY_ROLE.ADMIN.map((item) => item.to);
    expect(paths).toContain("/centers");
    expect(paths).toContain("/menu-imports");
  });

  it("AppShell shows only the menu of the role and marks the current page", () => {
    shell("TEACHER", "/students");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(
      within(nav)
        .getByRole("link", { name: "ENROLLED STUDENTS" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(within(nav).queryByRole("link", { name: "RIC TEACHERS" })).toBe(
      null,
    );
    expect(screen.getByText("Page body")).toBeDefined();
  });

  it("a Parent sees no Teacher or Admin links", () => {
    shell("PARENT");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["CALENDAR", "PROFILE"]);
    for (const label of [
      ...labels("ADMIN").filter((item) => !labels("PARENT").includes(item)),
      ...labels("TEACHER").filter((item) => !labels("PARENT").includes(item)),
    ]) {
      expect(within(nav).queryByRole("link", { name: label })).toBe(null);
    }
  });

  it("shows who is logged in, and logs out", () => {
    const { onLogout } = shell("TEACHER");
    expect(screen.getByText("Ana Cruz")).toBeDefined();
    expect(screen.getByText("RIC Teacher, Sibujo")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: LOGOUT_LABEL }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("the phone menu button opens the drawer with the same menu", () => {
    shell("ADMIN");
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getAllByRole("link", { name: "RIC TEACHERS", hidden: true }),
    ).toHaveLength(2);
  });
});

describe("sidebar layout (D12)", () => {
  it("is fixed to the viewport with a scrolling menu and a pinned logout", () => {
    shell("TEACHER");
    const sidebar = screen.getByTestId("sidebar");
    for (const name of ["sticky", "top-0", "h-dvh", "flex-col"]) {
      expect(sidebar.classList).toContain(name);
    }
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.classList).toContain("overflow-y-auto");
    expect(nav.classList).toContain("min-h-0");
    const logoutRow = screen.getByTestId("sidebar-logout");
    expect(logoutRow.classList).toContain("mt-auto");
    expect(logoutRow.classList).toContain("shrink-0");
  });

  it("shows the client's logo with alt text, the name and the address", () => {
    shell("TEACHER");
    const sidebar = within(screen.getByTestId("sidebar"));
    expect(
      sidebar.getByRole("img", { name: "Rural Improvement Club emblem" }),
    ).toBeDefined();
    expect(sidebar.getByText("Rural Improvement Club")).toBeDefined();
    expect(sidebar.getByText("Libmanan, Camarines Sur")).toBeDefined();
  });

  it("the footer is the last child inside the scrolling content area (D1 of Plan 3)", () => {
    shell("TEACHER");
    const scroller = screen.getByTestId("content-scroll");
    for (const name of [
      "flex",
      "flex-col",
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    ]) {
      expect(scroller.classList).toContain(name);
    }
    const footer = scroller.lastElementChild;
    expect(footer?.tagName).toBe("FOOTER");
    expect(footer?.classList).toContain("mt-auto");
    const footerClasses = [...(footer?.classList ?? [])];
    expect(
      footerClasses.filter((name) => /(^|:)(fixed|sticky)$/.test(name)),
    ).toEqual([]);
    expect(screen.getByRole("main").parentElement).toBe(scroller);
    expect(screen.getByRole("main").classList).toContain("flex-1");
  });

  it("the header has at least 12 px around the user block and centers it (D3)", () => {
    shell("ADMIN");
    const header = screen.getByTestId("top-bar");
    for (const name of [
      "items-center",
      "py-[max(12px,0.75rem)]",
      "pr-[max(12px,1.5rem)]",
    ]) {
      expect(header.classList).toContain(name);
    }
    expect(
      [...header.classList].filter((name) => /(^|:)(fixed|sticky)$/.test(name)),
    ).toEqual([]);
  });
});

describe("viewport fit (D3, D5 of docs/POLISH_PLAN_2.md)", () => {
  it("the shell is one screen high and never scrolls the document", () => {
    shell("ADMIN");
    const column = screen.getByTestId("page-column");
    expect(column.classList).toContain("h-dvh");
    expect(column.parentElement?.classList).toContain("h-dvh");
    expect(column.parentElement?.classList).toContain("overflow-hidden");
  });

  it("only the content area scrolls; it is a size container for fit pages", () => {
    shell("ADMIN");
    const column = screen.getByTestId("page-column");
    expect(column.classList).toContain("overflow-hidden");
    const scroller = screen.getByTestId("content-scroll");
    expect(scroller.classList).toContain("overflow-y-auto");
    expect(scroller.classList).toContain("[container-type:size]");
  });

  it("the sidebar width comes from --sidebar-w", () => {
    shell("ADMIN");
    expect(screen.getByTestId("sidebar").classList).toContain(
      "w-(--sidebar-w)",
    );
  });

  it("Admin and Teacher get exactly the same sidebar header", () => {
    const brandOf = (role: ShellUser["role"]) => {
      const view = render(
        <MemoryRouter>
          <AppShell
            user={{ fullName: "Ana Cruz", role, centerName: "Sibujo" }}
            onLogout={() => undefined}
          >
            <p>Page body</p>
          </AppShell>
        </MemoryRouter>,
      );
      const html = within(view.container).getByTestId(
        "sidebar-brand",
      ).outerHTML;
      view.unmount();
      return html;
    };
    expect(brandOf("ADMIN")).toBe(brandOf("TEACHER"));
    expect(brandOf("PARENT")).toBe(brandOf("TEACHER"));
  });
});

describe("AppFooter (Figma 268:10479, 267:9689)", () => {
  function footer(role: ShellUser["role"]) {
    render(
      <MemoryRouter>
        <AppFooter role={role} />
      </MemoryRouter>,
    );
  }

  it("Teacher: full footer, with quick links from the Teacher menu", () => {
    footer("TEACHER");
    expect(screen.getByText("Quick links")).toBeDefined();
    expect(screen.getByText("Station-Church Site")).toBeDefined();
    const links = within(
      screen.getByRole("navigation", { name: "Quick links" }),
    );
    expect(
      links.getByRole("link", { name: "ENROLLED STUDENTS" }),
    ).toBeDefined();
    expect(links.queryByRole("link", { name: "RIC TEACHERS" })).toBe(null);
    expect(
      screen.getByRole("link", { name: "maolibmanan4407@gmail.com" }),
    ).toBeDefined();
  });

  it("Admin: the single copyright line that the Admin frames show", () => {
    footer("ADMIN");
    expect(
      screen.getByText(/RICPortal — Rural Improvement Club\./),
    ).toBeDefined();
    expect(screen.queryByText("Quick links")).toBe(null);
  });
});
