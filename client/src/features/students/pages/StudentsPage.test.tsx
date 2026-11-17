import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { ToastProvider } from "../../../components/toast/ToastProvider";

vi.mock("../../auth/components/guards", () => ({
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

const { StudentsPage } = await import("./StudentsPage");

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => {
      const body = path.startsWith("/api/students/summary")
        ? { data: { total: 0, schoolYear: "2026-2027" }, meta: {} }
        : { data: [], meta: { page: 1, pageSize: 20, total: 0 } };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openExport() {
  mockApi();
  renderWithQuery(
    <ToastProvider>
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
  await screen.findByText("Student List for 2026");
  fireEvent.click(screen.getByRole("button", { name: "Export List" }));
  return screen.findByRole("dialog");
}

describe("Export List (D9)", () => {
  it("replaces the Enrollment Form button", async () => {
    await openExport();
    expect(screen.queryByRole("button", { name: "Enrollment Form" })).toBe(
      null,
    );
  });

  it("opens the PDF of the current school year by default", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const dialog = await openExport();
    fireEvent.click(within(dialog).getByRole("button", { name: "Open PDF" }));
    const url = String(open.mock.calls[0]?.[0]);
    expect(url).toContain("/api/enrollment-form.pdf");
    expect(url).toContain("schoolYear=2026-2027");
  });

  it("offers an earlier school year inside the dialog", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const dialog = await openExport();
    const select = within(dialog).getByLabelText(/School Year/);
    const earlier = [...(select as HTMLSelectElement).options][1]?.value ?? "";
    expect(earlier).not.toBe("2026-2027");
    fireEvent.change(select, { target: { value: earlier } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Open PDF" }));
    expect(String(open.mock.calls[0]?.[0])).toContain(`schoolYear=${earlier}`);
  });
});

// Plan 5 J2: the toolbar and row icons of Figma 78:260.
describe("Enrolled Students against frame 78:260", () => {
  function student(id: number) {
    return {
      id,
      schoolYear: "2026-2027",
      displayName: "Aquino, Rafael C.",
      age: 3,
      gender: "MALE",
      enrolledOn: "2026-06-08",
      status: "ACTIVE",
      isEditable: true,
    };
  }

  async function open() {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        const body = path.startsWith("/api/students/summary")
          ? { data: { total: 1, schoolYear: "2026-2027" }, meta: {} }
          : { data: [student(1)], meta: { page: 1, pageSize: 20, total: 1 } };
        return Promise.resolve(
          new Response(JSON.stringify(body), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }),
    );
    renderWithQuery(
      <ToastProvider>
        <MemoryRouter>
          <StudentsPage />
        </MemoryRouter>
      </ToastProvider>,
    );
    await screen.findByText("Student List for 2026");
  }

  it("Add Student is the green button of the frame", async () => {
    await open();
    const add = screen.getByRole("button", { name: "Add Student" });
    expect(add.classList).toContain("bg-accent");
    expect(add.classList).not.toContain("bg-primary");
  });

  it("the search field carries the search icon", async () => {
    await open();
    const search = screen.getByLabelText("Search");
    expect(
      search.parentElement?.querySelector('[data-icon="search"]'),
    ).not.toBeNull();
    expect(search.classList).toContain("pl-10");
  });

  it("the location line starts with the pin", async () => {
    await open();
    const line = screen.getByText(/Libmanan, Camarines Sur/);
    expect(line.querySelector('[data-icon="map-pin"]')).not.toBeNull();
  });

  it("the edit icon is green, the archive icon gray", async () => {
    await open();
    // The table and the phone cards each render the row's buttons.
    const edits = await screen.findAllByRole("button", {
      name: "Edit Aquino, Rafael C.",
    });
    const archives = screen.getAllByRole("button", {
      name: "Archive Aquino, Rafael C.",
    });
    expect(edits.length).toBeGreaterThan(0);
    for (const edit of edits) {
      expect(edit.classList).toContain("text-accent!");
    }
    for (const archive of archives) {
      expect(archive.classList).toContain("text-text-muted!");
    }
  });
});
