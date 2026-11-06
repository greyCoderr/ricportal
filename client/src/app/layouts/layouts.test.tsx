import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { NAV_BY_ROLE } from "./nav";
import { ParentLayout } from "./ParentLayout";

function shell(role: "ADMIN" | "TEACHER", path = "/") {
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

describe("role-aware navigation", () => {
  it("each role has its own menu", () => {
    const paths = (role: keyof typeof NAV_BY_ROLE) =>
      NAV_BY_ROLE[role].map((item) => item.to);
    expect(paths("ADMIN")).toContain("/centers");
    expect(paths("TEACHER")).not.toContain("/centers");
    expect(paths("TEACHER")).toContain("/parents");
    expect(paths("ADMIN")).not.toContain("/parents");
    expect(paths("PARENT")).toEqual(["/"]);
  });

  it("AppShell shows only the menu of the role and marks the current page", () => {
    shell("TEACHER", "/students");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(
      within(nav)
        .getByRole("link", { name: "Enrolled Students" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(within(nav).queryByRole("link", { name: "Centers" })).toBe(null);
    expect(screen.getByText("Page body")).toBeDefined();
  });

  it("shows who is logged in, and logs out", () => {
    const { onLogout } = shell("TEACHER");
    expect(screen.getByText("Ana Cruz")).toBeDefined();
    expect(screen.getByText("RIC Teacher, Sibujo")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("the phone menu button toggles the sidebar", () => {
    shell("ADMIN");
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("ParentLayout", () => {
  it("has a top bar with the name and log out, and no sidebar", () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <ParentLayout user={{ fullName: "Rosa Dela Cruz" }} onLogout={onLogout}>
          <p>Schedule</p>
        </ParentLayout>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("navigation", { name: "Main" })).toBe(null);
    expect(screen.getByText("Rosa Dela Cruz")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    const logout = screen.getByRole("button", { name: "Log out" });
    expect(logout.classList).toContain("h-11");
  });
});
