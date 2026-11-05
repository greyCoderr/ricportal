import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "../../../../test/render";
import { HealthPage } from "./HealthPage";

const OK_BODY = {
  data: { status: "ok", db: "up", time: "2026-11-03T02:30:00.000Z" },
  meta: {},
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HealthPage", () => {
  it("shows the loading state first", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
    );
    renderWithQuery(<HealthPage />);

    expect(screen.getByRole("status").textContent).toContain(
      "Checking the server…",
    );
  });

  it("shows server ok, database up and the time in Asia/Manila", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => Promise.resolve(json(200, OK_BODY))),
    );
    renderWithQuery(<HealthPage />);

    const region = await screen.findByRole("region", { name: "System status" });
    expect(region.textContent).toContain("Server: ok");
    expect(region.textContent).toContain("Database: up");
    // 02:30 UTC is 10:30 in Asia/Manila (UTC+8).
    expect(region.textContent).toMatch(/Checked at .*10:30/);
  });

  it("shows the SERVICE_UNAVAILABLE message on 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          json(503, {
            error: {
              code: "SERVICE_UNAVAILABLE",
              message:
                "The service is temporarily unavailable. Please try again.",
              details: [],
            },
          }),
        ),
      ),
    );
    renderWithQuery(<HealthPage />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "The service is temporarily unavailable. Please try again.",
    );
  });

  it("shows the network message when the server cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() =>
        Promise.reject(new TypeError("Failed to fetch")),
      ),
    );
    renderWithQuery(<HealthPage />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Cannot reach the server. Please check your connection and try again.",
    );
  });

  it("fetches again with Try again and then shows success", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(json(200, OK_BODY));
    vi.stubGlobal("fetch", fetchMock);
    renderWithQuery(<HealthPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    const region = await screen.findByRole("region", { name: "System status" });
    expect(region.textContent).toContain("Database: up");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("HealthPage uses semantic tokens (DEC-022)", () => {
  function classesOf(element: Element): string[] {
    return element.className.split(/\s+/);
  }

  it("loading text uses text-muted", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)),
    );
    renderWithQuery(<HealthPage />);

    expect(classesOf(screen.getByRole("status"))).toContain("text-text-muted");
  });

  it("success panel uses the success tokens on the surface", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => Promise.resolve(json(200, OK_BODY))),
    );
    renderWithQuery(<HealthPage />);

    const region = await screen.findByRole("region", { name: "System status" });
    expect(classesOf(region)).toEqual(
      expect.arrayContaining([
        "border-success",
        "bg-success-soft",
        "text-text",
      ]),
    );
    expect(classesOf(screen.getByRole("main"))).toEqual(
      expect.arrayContaining(["bg-surface", "text-text"]),
    );
  });

  it("error panel uses the danger tokens and a primary button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() =>
        Promise.reject(new TypeError("Failed to fetch")),
      ),
    );
    renderWithQuery(<HealthPage />);

    const alert = await screen.findByRole("alert");
    expect(classesOf(alert)).toEqual(
      expect.arrayContaining([
        "border-danger",
        "bg-danger-soft",
        "text-danger-text",
      ]),
    );
    expect(
      classesOf(screen.getByRole("button", { name: "Try again" })),
    ).toEqual(expect.arrayContaining(["bg-primary", "text-primary-contrast"]));
  });
});
