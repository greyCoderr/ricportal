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

const SUMMARY = {
  teacherCode: "RIC-2026-002",
  centerName: "Sibujo",
  createdAt: "2026-03-01T02:00:00.000Z",
  counts: {
    enrolledStudents: 15,
    submittedReports: 6,
    pendingReports: 1,
    returnedReports: 2,
  },
  reports: [
    {
      id: 7,
      code: "2026-007",
      type: "LIQUIDATION",
      submittedAt: "2026-06-02T00:30:00.000Z",
      status: "APPROVED",
    },
    {
      id: 5,
      code: "2026-005",
      type: "LIQUIDATION",
      submittedAt: "2026-05-05T00:30:00.000Z",
      status: "NEED_REVISION",
    },
  ],
  activity: [
    {
      at: "2026-06-03T07:30:00.000Z",
      reportCode: "2026-007",
      text: "Admin approved the report.",
    },
    {
      at: "2026-06-02T00:30:00.000Z",
      reportCode: "2026-007",
      text: "Report submitted.",
    },
  ],
};

const summaryPage = (page: number, total = 12) => ({
  status: 200,
  body: { data: SUMMARY, meta: { page, pageSize: 5, total } },
});

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
  "GET /api/auth/profile/teacher-summary?page=1&pageSize=5": summaryPage(1),
  "GET /api/auth/profile/teacher-summary?page=2&pageSize=5": summaryPage(2),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProfilePage (D11)", () => {
  it("Plan 4 D9: the Teacher header card as Figma 88:695", async () => {
    mockApi({
      ...READ,
      "GET /api/auth/profile": ok({
        ...PROFILE,
        email: "ana@example.com",
        address: "Purok 2, Sibujo",
        sex: "Female",
        birthDate: "1990-03-14",
        qualification: "Bachelor of Elementary Education",
      }),
    });
    renderPage();
    await screen.findByRole("heading", { name: "RIC Teacher Profile" });
    const card = await screen.findByRole("region", { name: "Ana Cruz" });
    for (const text of [
      "Active Teacher",
      "ana@example.com",
      "09171234567",
      "Purok 2, Sibujo",
      "Female",
      "03/01/2026",
      "03/14/1990",
      "Sibujo",
      "Bachelor of Elementary Education",
    ]) {
      expect(within(card).getByText(text)).toBeDefined();
    }
    expect(await within(card).findByText("RIC-2026-002")).toBeDefined();
    for (const label of [
      "Teacher ID",
      "Sex",
      "Date Registered",
      "BirthDate",
      "Barangay",
      "Qualification",
    ]) {
      expect(within(card).getByText(label)).toBeDefined();
    }
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

  it("Plan 4 D9: four stat cards with the real counts and Figma's links", async () => {
    mockApi(READ);
    renderPage();
    for (const [label, value, link] of [
      ["Total Enrolled Students", "15", "View all students"],
      ["Submitted Reports", "6", "View all reports"],
      ["Pending Reports", "1", "For approval"],
      ["Return for Revision", "2", "Review and Revise"],
    ] as const) {
      const card = (await screen.findByText(label)).closest("[data-stat]");
      if (!(card instanceof HTMLElement)) throw new Error(label);
      expect(within(card).getByText(value)).toBeDefined();
      expect(within(card).getByRole("link", { name: link })).toBeDefined();
    }
    expect(screen.queryByText("Children Enrolled")).toBe(null);
  });

  it("Plan 4 D9: Recent Submitted Reports with Report ID, date and Manila time", async () => {
    mockApi(READ);
    renderPage();
    const table = await screen.findByRole("table", {
      name: "Recent Submitted Reports",
    });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Report ID", "Report Type", "Date and Time", "Status"]);
    expect(within(table).getByText("2026-007")).toBeDefined();
    expect(within(table).getAllByText("Liquidation Report")).toHaveLength(2);
    expect(within(table).getByText("06/02/2026 8:30 AM")).toBeDefined();
    expect(within(table).getByText("Need Revision")).toBeDefined();
    expect(table.querySelector("thead tr")?.className).toContain(
      "ric-table-band",
    );
  });

  it("Plan 4 D9: numbered pages, 5 per page, with aria-current", async () => {
    const calls = mockApi(READ);
    renderPage();
    const pages = await screen.findByRole("navigation", {
      name: "Report pages",
    });
    const buttons = within(pages).getAllByRole("button", { name: /^Page / });
    expect(buttons.map((button) => button.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(buttons[0]?.getAttribute("aria-current")).toBe("page");
    fireEvent.click(within(pages).getByRole("button", { name: "Page 2" }));
    await waitFor(() => {
      expect(
        within(pages)
          .getByRole("button", { name: "Page 2" })
          .getAttribute("aria-current"),
      ).toBe("page");
    });
    expect(
      calls.some((call) =>
        call.path.endsWith("teacher-summary?page=2&pageSize=5"),
      ),
    ).toBe(true);
  });

  it("Plan 4 D9: Recent Status Activity with date, time and text", async () => {
    mockApi(READ);
    renderPage();
    const list = await screen.findByRole("list", {
      name: "Recent Status Activity",
    });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0] as HTMLElement).getByText("06/03/2026"),
    ).toBeDefined();
    expect(within(items[0] as HTMLElement).getByText("3:30 PM")).toBeDefined();
    expect(
      within(items[0] as HTMLElement).getByText("Admin approved the report."),
    ).toBeDefined();
    expect(
      within(items[1] as HTMLElement).getByText("Report submitted."),
    ).toBeDefined();
  });

  it("Plan 4 D9: Edit Profile and Account Security stay below", async () => {
    mockApi(READ);
    renderPage();
    expect(
      await screen.findByRole("button", { name: "Edit Profile" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Change Password" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    expect(screen.getByLabelText(/^Qualification/)).toBeDefined();
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
    "D7: %s opens the last logins with numeric dates (Admin, whose System Activity card stays)",
    async (label) => {
      mockApi({
        "GET /api/auth/profile": ok({
          ...PROFILE,
          role: "ADMIN",
          username: "admin",
          centerId: null,
          centerName: null,
        }),
        "GET /api/auth/profile/activity": ok({
          role: "ADMIN",
          teachersManaged: 1,
          enrolledStudents: 2,
          reportsGenerated: 3,
          loginsThisMonth: 4,
        }),
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

  it("D9: an empty field shows Not set in the Teacher header card", async () => {
    mockApi(READ);
    renderPage();
    const card = await screen.findByRole("region", { name: "Ana Cruz" });
    expect(within(card).getAllByText("Not set").length).toBeGreaterThan(0);
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
