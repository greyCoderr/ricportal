import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../test/render";
import { ToastProvider } from "../../components/toast/ToastProvider";

vi.mock("../auth/components/guards", () => ({
  useCurrentUser: () => ({
    id: 2,
    role: "TEACHER",
    username: "teacher.sibujo",
    fullName: "Ana Cruz",
    centerId: 1,
    centerName: "Sibujo",
    mustChangePassword: false,
  }),
}));

const { ChildRecordsPage } = await import("./pages/ChildRecordsPage");
const { ChildRecordDetailPage } = await import("./pages/ChildRecordDetailPage");

const STUDENT = {
  id: 7,
  centerId: 1,
  schoolYear: "2026-2027",
  lastName: "Nieves",
  firstName: "Alucard",
  middleName: "P",
  displayName: "Nieves, Alucard P.",
  gender: "M",
  age: 5,
  status: "ACTIVE",
  isEditable: true,
  enrolledOn: "2026-06-08",
};

const ROW = {
  ...STUDENT,
  records: { conferences: 2, homeVisits: 1, progress: 0 },
};

type Call = { path: string; method: string; body: unknown };

function mockApi(answers: Record<string, unknown>) {
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
      const key = `${method} ${path.split("?")[0] ?? path}`;
      const known = key in answers;
      return Promise.resolve(
        new Response(
          JSON.stringify(
            known
              ? {
                  data: answers[key],
                  meta: { page: 1, pageSize: 20, total: 1 },
                }
              : {
                  error: { code: "INTERNAL", message: "no route", details: [] },
                },
          ),
          {
            status: known ? 200 : 500,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderList() {
  renderWithQuery(
    <MemoryRouter>
      <ChildRecordsPage />
    </MemoryRouter>,
  );
}

function renderDetail() {
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter initialEntries={["/child-records/7"]}>
        <Routes>
          <Route
            path="/child-records/:id"
            element={<ChildRecordDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("Child's Record list (D10, 169:3189)", () => {
  it("shows each child with the record counts and a link", async () => {
    mockApi({ "GET /api/child-records": [ROW] });
    renderList();
    expect(await screen.findByText("Nieves, Alucard P.")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Child's Record" }),
    ).toBeDefined();
    expect(screen.getByText("Age: 5")).toBeDefined();
    expect(screen.getByText("Sex: Male")).toBeDefined();
    expect(screen.getByText("Conferences: 2")).toBeDefined();
    expect(screen.getByText("Home Visits: 1")).toBeDefined();
    expect(screen.getByText("Progress: 0")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "View record of Nieves, Alucard P." })
        .getAttribute("href"),
    ).toBe("/child-records/7");
  });

  it("names the center when there are no children", async () => {
    mockApi({ "GET /api/child-records": [] });
    renderList();
    expect(
      await screen.findByText("No students enrolled at Sibujo yet."),
    ).toBeDefined();
  });

  it("offers Retry when loading fails", async () => {
    mockApi({});
    renderList();
    expect(await screen.findByRole("button", { name: "Retry" })).toBeDefined();
  });
});

describe("Child's Record detail (D10)", () => {
  const ANSWERS = {
    "GET /api/students/7": STUDENT,
    "GET /api/students/7/conferences": [],
    "GET /api/students/7/home-visits": [],
    "GET /api/students/7/progress": [
      {
        id: 40,
        studentId: 7,
        noteDate: "2026-11-04",
        progressNotes: "Counts to ten.",
      },
    ],
  };

  async function openProgress() {
    fireEvent.click(await screen.findByRole("tab", { name: "Progress" }));
    await screen.findByText("Counts to ten.");
  }

  it("has the tabs Conferences, Home Visits and Progress", async () => {
    mockApi(ANSWERS);
    renderDetail();
    await screen.findByRole("tab", { name: "Conferences" });
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Conferences",
      "Home Visits",
      "Progress",
    ]);
  });

  it("Progress lists entries with numeric dates", async () => {
    mockApi(ANSWERS);
    renderDetail();
    await openProgress();
    expect(screen.getByText("11/04/2026")).toBeDefined();
  });

  it("Progress adds an entry", async () => {
    const calls = mockApi({
      ...ANSWERS,
      "POST /api/students/7/progress": {
        id: 41,
        studentId: 7,
        noteDate: "2026-11-05",
        progressNotes: "Names the colors.",
      },
    });
    renderDetail();
    await openProgress();
    fireEvent.click(screen.getByRole("button", { name: "Add progress note" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Progress notes/), {
      target: { value: "Names the colors." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      const post = calls.find((call) => call.method === "POST");
      expect((post?.body as { progressNotes: string }).progressNotes).toBe(
        "Names the colors.",
      );
    });
  });

  it("Progress edits and deletes through the existing API", async () => {
    const calls = mockApi({
      ...ANSWERS,
      "PATCH /api/progress/40": {
        id: 40,
        studentId: 7,
        noteDate: "2026-11-04",
        progressNotes: "Counts to twenty.",
      },
      "DELETE /api/progress/40": { deleted: true },
    });
    renderDetail();
    await openProgress();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit progress note of 11/04/2026",
      }),
    );
    let dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Progress notes/), {
      target: { value: "Counts to twenty." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(calls.some((call) => call.method === "PATCH")).toBe(true);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBe(null);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete progress note of 11/04/2026",
      }),
    );
    dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(calls.some((call) => call.method === "DELETE")).toBe(true);
    });
  });
});
