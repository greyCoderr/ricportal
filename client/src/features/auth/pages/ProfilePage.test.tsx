import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ProfilePage } from "./ProfilePage";

type Call = { path: string; method: string; body: unknown };

const PROFILE = {
  id: 2,
  role: "TEACHER",
  username: "teacher.sibujo",
  fullName: "Ana Cruz",
  mobile: "09171234567",
  centerId: 21,
  centerName: "Sibujo",
  status: "ACTIVE",
};

function mockApi(answers: Record<string, { status: number; body: unknown }>) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({
        path,
        method,
        body:
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as unknown)
            : undefined,
      });
      const answer = answers[`${method} ${path}`] ?? {
        status: 500,
        body: { error: { code: "INTERNAL", message: "no route", details: [] } },
      };
      return Promise.resolve(
        new Response(JSON.stringify(answer.body), {
          status: answer.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

function renderPage() {
  renderWithQuery(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

const READ = {
  "GET /api/auth/profile": { status: 200, body: { data: PROFILE, meta: {} } },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProfilePage (D11)", () => {
  it("shows name, username, role, center and mobile", async () => {
    mockApi(READ);
    renderPage();
    await screen.findByRole("heading", { name: "RIC Teacher Profile" });
    expect(screen.getByText("Ana Cruz")).toBeDefined();
    expect(screen.getByText("teacher.sibujo")).toBeDefined();
    expect(screen.getByText("RIC Teacher")).toBeDefined();
    expect(screen.getByText("Sibujo")).toBeDefined();
    expect(screen.getByText("09171234567")).toBeDefined();
  });

  it("shows an error with Retry when loading fails", async () => {
    mockApi({});
    renderPage();
    expect(
      await screen.findByText("Could not load your profile."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  it("edits the name and mobile", async () => {
    const calls = mockApi({
      ...READ,
      "PATCH /api/auth/profile": {
        status: 200,
        body: { data: { ...PROFILE, fullName: "Ana B. Cruz" }, meta: {} },
      },
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Profile" }),
    );
    const name = screen.getByLabelText(/Full name/);
    expect((name as HTMLInputElement).value).toBe("Ana Cruz");
    fireEvent.change(name, { target: { value: "Ana B. Cruz" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(calls.some((call) => call.method === "PATCH")).toBe(true);
    });
    expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({
      fullName: "Ana B. Cruz",
      mobile: "09171234567",
    });
    expect(await screen.findByText("Ana B. Cruz")).toBeDefined();
  });

  it("shows the server's field message on a failed edit", async () => {
    mockApi({
      ...READ,
      "PATCH /api/auth/profile": {
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Some fields are not valid.",
            details: [{ field: "mobile", message: "Enter a mobile number." }],
          },
        },
      },
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Profile" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Enter a mobile number.")).toBeDefined();
  });

  it("changes the password and confirms it", async () => {
    const calls = mockApi({
      ...READ,
      "POST /api/auth/change-password": {
        status: 200,
        body: {
          data: {
            id: 2,
            role: "TEACHER",
            username: "teacher.sibujo",
            fullName: "Ana Cruz",
            centerId: 21,
            centerName: "Sibujo",
            mustChangePassword: false,
          },
          meta: {},
        },
      },
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Change Password" }),
    );
    fireEvent.change(
      screen.getByLabelText(/Current password/, { selector: "input" }),
      {
        target: { value: "Demo2026!" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/^New password/, { selector: "input" }),
      {
        target: { value: "Fresh2026pw" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/Confirm new password/, { selector: "input" }),
      {
        target: { value: "Fresh2026pw" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByText("Your password was changed.")).toBeDefined();
    expect(
      calls.find((call) => call.path === "/api/auth/change-password")?.body,
    ).toEqual({
      currentPassword: "Demo2026!",
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
  });

  it("shows a wrong current password under its field", async () => {
    mockApi({
      ...READ,
      "POST /api/auth/change-password": {
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Some fields are not valid.",
            details: [
              {
                field: "currentPassword",
                message: "Your current password is not correct.",
              },
            ],
          },
        },
      },
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Change Password" }),
    );
    fireEvent.change(
      screen.getByLabelText(/Current password/, { selector: "input" }),
      {
        target: { value: "Wrong2026pw" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/^New password/, { selector: "input" }),
      {
        target: { value: "Fresh2026pw" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(/Confirm new password/, { selector: "input" }),
      {
        target: { value: "Fresh2026pw" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(
      await screen.findByText("Your current password is not correct."),
    ).toBeDefined();
  });
});
