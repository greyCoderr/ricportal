import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/toast/ToastProvider";
import { createQueryClient } from "../../lib/query-client";
import { RequireRole, RequireSession } from "./components/guards";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { LoginPage, safeReturnPath } from "./pages/LoginPage";
import { RequestSentPage } from "./pages/SignupPage";

type Answer = { status: number; body: unknown };

function jsonResponse({ status, body }: Answer) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const USER = {
  id: 1,
  role: "TEACHER",
  username: "teacher.sibujo",
  fullName: "Ana Cruz",
  centerId: 21,
  centerName: "Sibujo",
  mustChangePassword: false,
};

function mockApi(routes: Record<string, Answer>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) =>
      Promise.resolve(
        jsonResponse(
          routes[path] ?? {
            status: 500,
            body: {
              error: { code: "INTERNAL", message: "no route", details: [] },
            },
          },
        ),
      ),
    ),
  );
}

const UNAUTHENTICATED: Answer = {
  status: 401,
  body: {
    error: { code: "UNAUTHENTICATED", message: "Please log in.", details: [] },
  },
};

function renderApp(initial: string) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/request-sent", element: <RequestSentPage /> },
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <RequireSession />,
        children: [
          { path: "/", element: <p>Home body</p> },
          {
            element: <RequireRole roles={["ADMIN"]} />,
            children: [{ path: "/centers", element: <p>Centers body</p> }],
          },
          { path: "/students", element: <p>Students body</p> },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("route guards", () => {
  it("no session redirects to login with the return path", async () => {
    mockApi({ "/api/auth/me": UNAUTHENTICATED });
    const router = renderApp("/students?page=2");
    // The first render of the file: its cold start missed the default 1 s wait
    // once under full-suite load (sprint log).
    await screen.findByRole(
      "heading",
      { name: "Welcome Back" },
      { timeout: 5000 },
    );
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe(
      `?from=${encodeURIComponent("/students?page=2")}`,
    );
  });

  it("mustChangePassword blocks everything else", async () => {
    mockApi({
      "/api/auth/me": {
        status: 200,
        body: { data: { ...USER, mustChangePassword: true }, meta: {} },
      },
    });
    const router = renderApp("/students");
    await screen.findByRole("heading", { name: "Change your password" });
    expect(router.state.location.pathname).toBe("/change-password");
    expect(screen.queryByText("Students body")).toBe(null);
  });

  it("a page of another role shows the 403 page", async () => {
    mockApi({
      "/api/auth/me": { status: 200, body: { data: USER, meta: {} } },
    });
    renderApp("/centers");
    await screen.findByRole("heading", { name: "You cannot open this page" });
    expect(screen.queryByText("Centers body")).toBe(null);
  });

  it("the right role sees the page inside the shell", async () => {
    mockApi({
      "/api/auth/me": { status: 200, body: { data: USER, meta: {} } },
    });
    renderApp("/students");
    await screen.findByText("Students body");
    expect(screen.getByText("RIC Teacher, Sibujo")).toBeDefined();
  });
});

describe("LoginPage", () => {
  function fill() {
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "parent.x" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Test2026pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  }

  it("D2 of Plan 3: the username and password fields use the larger login size", async () => {
    mockApi({ "/api/auth/me": UNAUTHENTICATED });
    renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back" });
    for (const field of [
      screen.getByLabelText("Username"),
      screen.getByLabelText("Password"),
    ]) {
      expect(field.classList).toContain("h-(--login-field-h)");
      expect(field.classList).toContain("text-(length:--login-field-text)");
      expect(field.classList).not.toContain("h-11");
    }
  });

  it("shows required messages without calling the server", async () => {
    mockApi({ "/api/auth/me": UNAUTHENTICATED });
    renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back" });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Enter your username.")).toBeDefined();
    expect(screen.getByText("Enter your password.")).toBeDefined();
  });

  it.each([
    [401, "UNAUTHENTICATED", "Invalid username or password"],
    [
      403,
      "FORBIDDEN",
      "Your account is waiting for approval by your RIC Teacher.",
    ],
    [
      403,
      "FORBIDDEN",
      "Your request was declined. Please contact your RIC Teacher.",
    ],
    [
      403,
      "FORBIDDEN",
      "Your account is disabled. Please contact your RIC Teacher.",
    ],
    [429, "RATE_LIMITED", "Too many attempts. Try again in 15 minutes."],
  ])("shows the server message for %i: %s", async (status, code, message) => {
    mockApi({
      "/api/auth/me": UNAUTHENTICATED,
      "/api/auth/login": {
        status,
        body: { error: { code, message, details: [] } },
      },
    });
    renderApp("/login");
    await screen.findByRole("heading", { name: "Welcome Back" });
    fill();
    expect((await screen.findByRole("alert")).textContent).toContain(message);
  });

  it("success goes to the return path", async () => {
    mockApi({
      "/api/auth/me": UNAUTHENTICATED,
      "/api/auth/login": { status: 200, body: { data: USER, meta: {} } },
    });
    const router = renderApp(`/login?from=${encodeURIComponent("/students")}`);
    await screen.findByRole("heading", { name: "Welcome Back" });
    fill();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/students");
    });
  });

  it("only a path inside this site may be the return target", () => {
    expect(safeReturnPath("/students")).toBe("/students");
    expect(safeReturnPath(null)).toBe("/");
    expect(safeReturnPath("https://evil.example")).toBe("/");
    expect(safeReturnPath("//evil.example")).toBe("/");
  });
});

describe("Request sent (S-P1-07)", () => {
  it("opened without a sign-up result shows the login page", async () => {
    mockApi({ "/api/auth/me": UNAUTHENTICATED });
    const router = renderApp("/request-sent");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
