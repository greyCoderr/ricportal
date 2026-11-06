import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom({ explode }: { explode: boolean }) {
  if (explode) {
    throw new Error("Broken child");
  }
  return <p>All good</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary fallback={() => <p>Fallback</p>}>
        <Boom explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeDefined();
    expect(screen.queryByText("Fallback")).toBe(null);
  });

  it("shows the fallback with the error when a child throws", () => {
    // React reports the caught error to console.error; keep the test output quiet.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={({ error }) => <p>Failed: {error.message}</p>}>
        <Boom explode />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Failed: Broken child")).toBeDefined();
  });

  it("reset renders the children again", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    function Harness() {
      const [explode, setExplode] = useState(true);
      return (
        <ErrorBoundary
          fallback={({ reset }) => (
            <button
              type="button"
              onClick={() => {
                setExplode(false);
                reset();
              }}
            >
              Try again
            </button>
          )}
        >
          <Boom explode={explode} />
        </ErrorBoundary>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("All good")).toBeDefined();
  });

  it("wraps a thrown non-Error value in an Error", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Thrower(): never {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- the case under test
      throw "plain text";
    }
    render(
      <ErrorBoundary fallback={({ error }) => <p>Failed: {error.message}</p>}>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Failed: plain text")).toBeDefined();
  });
});
