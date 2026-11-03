import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, apiRequest } from "./api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(impl: () => Promise<Response>) {
  const fn = vi.fn<typeof fetch>(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function errorFrom(run: () => Promise<unknown>): Promise<ApiError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }
    throw error;
  }
  throw new Error("expected an ApiError");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiGet", () => {
  it("returns data and meta, with same-origin credentials and JSON headers", async () => {
    const fetchMock = mockFetch(() =>
      Promise.resolve(jsonResponse(200, { data: { a: 1 }, meta: {} })),
    );

    await expect(apiGet<{ a: number }>("/api/thing")).resolves.toEqual({
      data: { a: 1 },
      meta: {},
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/thing");
    expect(init?.method).toBe("GET");
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
    expect(init?.body).toBeUndefined();
  });

  it("turns the standard error body into an ApiError with code, message and details", async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse(503, {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "The service is temporarily unavailable. Please try again.",
            details: [{ field: "x", message: "y" }],
          },
        }),
      ),
    );

    const error = await errorFrom(() => apiGet("/api/health"));
    expect(error.status).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.message).toBe(
      "The service is temporarily unavailable. Please try again.",
    );
    expect(error.details).toEqual([{ field: "x", message: "y" }]);
  });

  it("turns a failed fetch into NETWORK_ERROR with status 0", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const error = await errorFrom(() => apiGet("/api/health"));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toBe(
      "Cannot reach the server. Please check your connection and try again.",
    );
    expect(error.details).toEqual([]);
  });

  it("turns a response that is not from our API (proxy error page) into NETWORK_ERROR", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response("<html>Bad Gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    const error = await errorFrom(() => apiGet("/api/health"));
    expect(error.status).toBe(502);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).not.toContain("Bad Gateway");
  });

  it("treats a 200 without the { data, meta } shape as NETWORK_ERROR", async () => {
    mockFetch(() => Promise.resolve(jsonResponse(200, { hello: "world" })));

    const error = await errorFrom(() => apiGet("/api/health"));
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBe(200);
  });

  it("never writes to the console", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    mockFetch(() =>
      Promise.resolve(
        jsonResponse(500, {
          error: { code: "INTERNAL", message: "secret-body", details: [] },
        }),
      ),
    );

    await errorFrom(() => apiGet("/api/x"));
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});

describe("apiRequest", () => {
  it("sends a JSON body with Content-Type", async () => {
    const fetchMock = mockFetch(() =>
      Promise.resolve(jsonResponse(201, { data: { id: 1 }, meta: {} })),
    );

    await apiRequest("POST", "/api/things", { name: "A" });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "A" }));
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(init?.credentials).toBe("same-origin");
  });
});
