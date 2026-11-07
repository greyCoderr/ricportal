import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";
import { AssignParentsModal } from "./AssignParentsModal";

const PARENTS = [
  { id: 1, fullName: "Ana Cruz", username: "ana.cruz" },
  { id: 2, fullName: "Ben Reyes", username: "ben.reyes" },
  { id: 3, fullName: "Cora Lim", username: "cora.lim" },
  { id: 4, fullName: "Dina Sy", username: "dina.sy" },
  { id: 5, fullName: "Eli Tan", username: "eli.tan" },
];

const day = (
  date: string,
  menuName: string | null,
  parentIds: number[] = [],
) => ({
  date,
  dayName: "Day",
  menuName,
  status: "NOT_OPENED",
  parents: PARENTS.filter((parent) => parentIds.includes(parent.id)),
});

const WEEK = {
  week: "2026-11-09",
  team: [],
  days: [
    day("2026-11-09", "PORK PICADILLO"),
    day("2026-11-10", "CHICKEN TINOLA"),
    day("2026-11-11", null),
  ],
};

type Call = { method: string; path: string; body: unknown };

function mockApi(
  week: object = WEEK,
  saveAnswer?: { status: number; body: unknown },
) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({
        method,
        path,
        body:
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as unknown)
            : undefined,
      });
      const answer =
        method === "PUT"
          ? (saveAnswer ?? { status: 200, body: { data: week, meta: {} } })
          : path === "/api/parents/approved"
            ? { status: 200, body: { data: PARENTS, meta: {} } }
            : { status: 200, body: { data: week, meta: {} } };
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

function renderModal(onClose = vi.fn()) {
  renderWithQuery(
    <ToastProvider>
      <AssignParentsModal initialMonday="2026-11-09" onClose={onClose} />
    </ToastProvider>,
  );
  return onClose;
}

async function chooseTeam(ids: number[]) {
  const first = await screen.findByLabelText("Team member 1");
  await within(first).findByRole("option", { name: "Ana Cruz (ana.cruz)" });
  ids.forEach((id, index) => {
    fireEvent.change(
      screen.getByLabelText(`Team member ${String(index + 1)}`),
      {
        target: { value: String(id) },
      },
    );
  });
}

function next() {
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssignParentsModal (D4)", () => {
  it("Step 1 has exactly four dropdowns showing Full name (username)", async () => {
    mockApi();
    renderModal();
    await chooseTeam([]);
    expect(screen.getAllByLabelText(/^Team member/)).toHaveLength(4);
    expect(screen.queryByLabelText("Team member 5")).toBe(null);
    expect(
      screen.getByRole("heading", { name: "Assign Parents" }),
    ).toBeDefined();
    expect(screen.getByText("Assign parents to cook foods.")).toBeDefined();
  });

  it("a parent chosen in one dropdown is not offered in another", async () => {
    mockApi();
    renderModal();
    await chooseTeam([1]);
    expect(
      within(screen.getByLabelText("Team member 2")).queryByRole("option", {
        name: "Ana Cruz (ana.cruz)",
      }),
    ).toBe(null);
    expect(
      within(screen.getByLabelText("Team member 1")).getByRole("option", {
        name: "Ana Cruz (ana.cruz)",
      }),
    ).toBeDefined();
  });

  it("Step 2 shows only feeding days, with the dish, and warns about empty days", async () => {
    mockApi();
    renderModal();
    await chooseTeam([1, 2]);
    next();
    expect(screen.getByText("Pork Picadillo")).toBeDefined();
    expect(screen.getByText("Chicken Tinola")).toBeDefined();
    expect(screen.getAllByText("0 of 2 parents")).toHaveLength(2);
    expect(screen.getAllByText("No parent assigned")).toHaveLength(2);
    expect(screen.getByRole("alert").textContent).toContain("2 days");
  });

  it("the count follows the checkboxes and the warning clears", async () => {
    mockApi();
    renderModal();
    await chooseTeam([1, 2]);
    next();
    fireEvent.click(screen.getByLabelText("Ana Cruz on 11/09/2026"));
    expect(screen.getByText("1 of 2 parents")).toBeDefined();
    expect(screen.getAllByText("No parent assigned")).toHaveLength(1);
  });

  it("Apply to all days copies the first day, and one Save sends the whole week", async () => {
    const calls = mockApi();
    const onClose = renderModal();
    await chooseTeam([1, 2]);
    next();
    fireEvent.click(screen.getByLabelText("Ana Cruz on 11/09/2026"));
    fireEvent.click(screen.getByLabelText("Ben Reyes on 11/09/2026"));
    fireEvent.click(screen.getByRole("button", { name: "Apply to all days" }));
    expect(
      screen.getByLabelText<HTMLInputElement>("Ben Reyes on 11/10/2026")
        .checked,
    ).toBe(true);
    expect(screen.queryByRole("alert")).toBe(null);
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(calls.filter((call) => call.method === "PUT")).toEqual([
      {
        method: "PUT",
        path: "/api/assignments/week",
        body: {
          week: "2026-11-09",
          teamParentIds: [1, 2],
          days: [
            { date: "2026-11-09", parentIds: [1, 2] },
            { date: "2026-11-10", parentIds: [1, 2] },
          ],
        },
      },
    ]);
  });

  it("opens with the saved team and days", async () => {
    mockApi({
      ...WEEK,
      team: [PARENTS[1]],
      days: [day("2026-11-09", "PORK PICADILLO", [2])],
    });
    renderModal();
    const slot =
      await screen.findByLabelText<HTMLSelectElement>("Team member 1");
    await waitFor(() => {
      expect(slot.value).toBe("2");
    });
    next();
    expect(
      screen.getByLabelText<HTMLInputElement>("Ben Reyes on 11/09/2026")
        .checked,
    ).toBe(true);
  });

  it("removing a parent from the team drops them from the days sent", async () => {
    const calls = mockApi({
      ...WEEK,
      team: [PARENTS[0], PARENTS[1]],
      days: [day("2026-11-09", "PORK PICADILLO", [1, 2])],
    });
    renderModal();
    const slot =
      await screen.findByLabelText<HTMLSelectElement>("Team member 2");
    await waitFor(() => {
      expect(slot.value).toBe("2");
    });
    fireEvent.change(slot, { target: { value: "" } });
    next();
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
    await waitFor(() => {
      expect(calls.some((call) => call.method === "PUT")).toBe(true);
    });
    expect(calls.find((call) => call.method === "PUT")?.body).toMatchObject({
      teamParentIds: [1],
      days: [{ date: "2026-11-09", parentIds: [1] }],
    });
  });

  it("a server refusal stays on screen and keeps the choices", async () => {
    mockApi(WEEK, {
      status: 422,
      body: {
        error: {
          code: "RULE_VIOLATION",
          message: "Only approved Parents of this center can be assigned.",
          details: [],
        },
      },
    });
    const onClose = renderModal();
    await chooseTeam([1]);
    next();
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }));
    expect(
      await screen.findByText(
        "Only approved Parents of this center can be assigned.",
      ),
    ).toBeDefined();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the week buttons move by seven days", async () => {
    const calls = mockApi();
    renderModal();
    await chooseTeam([]);
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    await waitFor(() => {
      expect(
        calls.some(
          (call) => call.path === "/api/assignments/week?week=2026-11-16",
        ),
      ).toBe(true);
    });
  });

  it("no approved parents: says what to do", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: path === "/api/parents/approved" ? [] : WEEK,
              meta: {},
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
      ),
    );
    renderModal();
    expect(await screen.findByText("No approved Parents yet.")).toBeDefined();
  });
});
