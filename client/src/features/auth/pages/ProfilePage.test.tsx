import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  email: null,
  address: null,
  position: null,
  sex: null,
  birthDate: null,
  qualification: null,
  createdAt: "2026-03-01T02:00:00.000Z",
  lastLoginAt: null,
  passwordChangedAt: null,
  passwordChangedDaysAgo: null,
};

const TEACHER_ACTIVITY = {
  role: "TEACHER",
  childrenEnrolled: 31,
  parentsApproved: 12,
  reportsSubmitted: 6,
  loginsThisMonth: 9,
};

const ok = (data: unknown) => ({ status: 200, body: { data, meta: {} } });

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
  "GET /api/auth/profile": ok(PROFILE),
  "GET /api/auth/profile/activity": ok(TEACHER_ACTIVITY),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProfilePage (D11)", () => {
  it("D7: shows the header card, the role and the center", async () => {
    mockApi(READ);
    renderPage();
    await screen.findByRole("heading", { name: "RIC Teacher Profile" });
    expect(screen.getAllByText("Ana Cruz").length).toBeGreaterThan(0);
    expect(screen.getAllByText("RIC Teacher").length).toBeGreaterThan(0);
    expect(screen.getByText("Sibujo")).toBeDefined();
    expect(screen.getAllByText("09171234567").length).toBeGreaterThan(0);
    expect(screen.getByText("Joined 03/01/2026")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("D7: Admin sees the frame's summary and four activity counts", async () => {
    mockApi({
      "GET /api/auth/profile": ok({
        ...PROFILE,
        role: "ADMIN",
        centerId: null,
        centerName: null,
      }),
      "GET /api/auth/profile/activity": ok({
        role: "ADMIN",
        teachersManaged: 28,
        enrolledStudents: 412,
        reportsGenerated: 18,
        loginsThisMonth: 24,
      }),
    });
    renderPage();
    expect(await screen.findByText("Teachers Managed")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeDefined();
    for (const text of [
      "28",
      "412",
      "Enrolled Students Monitored",
      "18",
      "Reports Generated",
      "24",
      "Logins This Month",
      "Full Access",
    ]) {
      expect(screen.getByText(text)).toBeDefined();
    }
    expect(screen.getAllByText("System Administrator").length).toBe(2);
  });

  it("D7: Teacher sees their counts and center details", async () => {
    mockApi(READ);
    renderPage();
    expect(await screen.findByText("Children Enrolled")).toBeDefined();
    for (const text of [
      "31",
      "Parents Approved",
      "Reports Submitted",
      "RIC-TCHR-002",
      "Position",
      "Qualification",
    ]) {
      expect(screen.getByText(text)).toBeDefined();
    }
  });

  it("D7: Parent sees the smaller version", async () => {
    mockApi({
      "GET /api/auth/profile": ok({ ...PROFILE, role: "PARENT" }),
      "GET /api/auth/profile/activity": ok({
        role: "PARENT",
        loginsThisMonth: 3,
      }),
    });
    renderPage();
    expect(await screen.findByText("Logins This Month")).toBeDefined();
    expect(screen.queryByText("Reports Submitted")).toBe(null);
    expect(screen.queryByText("Qualification")).toBe(null);
    expect(screen.queryByText("Permissions")).toBe(null);
  });

  it.each([
    [null, "Not changed yet"],
    [0, "Last changed today"],
    [1, "Last changed 1 day ago"],
    [30, "Last changed 30 days ago"],
  ])("D7: password changed %s shows %s", async (days, text) => {
    mockApi({
      ...READ,
      "GET /api/auth/profile": ok({
        ...PROFILE,
        passwordChangedDaysAgo: days,
      }),
    });
    renderPage();
    expect(await screen.findByText(text)).toBeDefined();
  });

  it("D7: 2FA and Active Sessions are disabled and say why", async () => {
    mockApi(READ);
    renderPage();
    const enable = await screen.findByRole("button", { name: "Enable" });
    expect((enable as HTMLButtonElement).disabled).toBe(true);
    const sessions = screen.getByRole("button", { name: "View Sessions" });
    expect((sessions as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText("Not available in this version").length).toBe(2);
  });

  it.each(["View History", "View All Activity"])(
    "D7: %s opens the last logins with numeric dates",
    async (label) => {
      mockApi({
        ...READ,
        "GET /api/auth/logins": ok([
          { at: "2026-11-05T02:00:00.000Z" },
          { at: "2026-11-01T02:00:00.000Z" },
        ]),
      });
      renderPage();
      fireEvent.click(await screen.findByRole("button", { name: label }));
      const list = await screen.findByRole("list", { name: "Last logins" });
      expect(list.querySelectorAll("li").length).toBe(2);
      expect(list.textContent).toContain("11/05/2026");
      expect(list.textContent).toContain("11/01/2026");
    },
  );

  it("D7: an empty login history says so", async () => {
    mockApi({ ...READ, "GET /api/auth/logins": ok([]) });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "View History" }),
    );
    expect(await screen.findByText("No logins recorded yet.")).toBeDefined();
  });

  it("D7: the Admin's edit form has the frame's six fields", async () => {
    mockApi({
      "GET /api/auth/profile": ok({
        ...PROFILE,
        role: "ADMIN",
        centerId: null,
        centerName: null,
      }),
      "GET /api/auth/profile/activity": ok({
        role: "ADMIN",
        teachersManaged: 0,
        enrolledStudents: 0,
        reportsGenerated: 0,
        loginsThisMonth: 0,
      }),
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Profile" }),
    );
    const dialog = await screen.findByRole("dialog");
    for (const label of [
      /Full Name/,
      /Date of Birth/,
      /Email Address/,
      /Gender/,
      /Contact Number/,
      /^Address/,
    ]) {
      expect(within(dialog).getByLabelText(label)).toBeDefined();
    }
    expect(within(dialog).queryByLabelText(/Qualification/)).toBe(null);
    expect(within(dialog).queryByLabelText(/Position/)).toBe(null);
  });

  it("D9: shows the frame's fields, and Not set for an empty one", async () => {
    mockApi({
      ...READ,
      "GET /api/auth/profile": ok({
        ...PROFILE,
        email: "ana@example.com",
        address: "Purok 2",
        sex: "Female",
        birthDate: "1990-03-14",
      }),
    });
    renderPage();
    await screen.findByRole("heading", { name: "RIC Teacher Profile" });
    for (const text of [
      "RIC-TCHR-002",
      "Joined 03/01/2026",
      "Purok 2",
      "Female",
      "03/14/1990",
    ]) {
      expect(screen.getByText(text)).toBeDefined();
    }
    expect(screen.getAllByText("ana@example.com").length).toBe(2);
    expect(screen.getAllByText("Not set").length).toBeGreaterThan(0);
  });

  it("D9: saves a new field, and only what changed", async () => {
    const calls = mockApi({
      ...READ,
      "PATCH /api/auth/profile": {
        status: 200,
        body: { data: { ...PROFILE, address: "Purok 2" }, meta: {} },
      },
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Profile" }),
    );
    fireEvent.change(screen.getByLabelText(/^Address/), {
      target: { value: "Purok 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({
        fullName: "Ana Cruz",
        mobile: "09171234567",
        address: "Purok 2",
      });
    });
  });

  it("D7: a Gender already set can be blanked again", async () => {
    const calls = mockApi({
      ...READ,
      "GET /api/auth/profile": ok({ ...PROFILE, sex: "Female" }),
      "PATCH /api/auth/profile": ok({ ...PROFILE, sex: null }),
    });
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Profile" }),
    );
    const gender = screen.getByLabelText(/Gender/);
    expect((gender as HTMLSelectElement).value).toBe("Female");
    const blank = within(gender).getByRole("option", {
      name: "Not set",
      hidden: true,
    });
    expect((blank as HTMLOptionElement).disabled).toBe(false);
    fireEvent.change(gender, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({
        fullName: "Ana Cruz",
        mobile: "09171234567",
        sex: "",
      });
    });
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
    const name = screen.getByLabelText(/Full Name/);
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
    await waitFor(() => {
      expect(screen.getAllByText("Ana B. Cruz").length).toBe(2);
    });
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
