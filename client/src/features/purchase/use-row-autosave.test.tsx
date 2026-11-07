import type { PurchaseItemDto } from "@ricportal/shared";
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api";
import { useRowAutosave, type RowSave } from "./use-row-autosave";

const ITEM: PurchaseItemDto = {
  id: 1,
  itemNo: 1,
  description: "Rice",
  unit: null,
  quantity: null,
  unitCost: null,
  total: null,
  version: 1,
  canDelete: true,
};

type Hook = ReturnType<typeof useRowAutosave>;
let hook: Hook;
function expose(value: Hook) {
  hook = value;
}

function Harness(props: {
  item: PurchaseItemDto;
  save: RowSave;
  onSaved?: () => void;
  onStale?: () => void;
}) {
  const current = useRowAutosave({
    item: props.item,
    save: props.save,
    onSaved: props.onSaved ?? (() => undefined),
    onStale: props.onStale ?? (() => undefined),
  });
  useEffect(() => {
    expose(current);
  });
  return <p>state: {current.state}</p>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useRowAutosave", () => {
  it("saves 600 ms after the last keystroke, with the version", async () => {
    const save = vi.fn<RowSave>().mockResolvedValue({ ...ITEM, version: 2 });
    render(<Harness item={ITEM} save={save} />);

    act(() => {
      hook.setField("quantity", "2");
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      hook.setField("quantity", "25");
    });
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(save).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ version: 1, quantity: "25" });
    expect(screen.getByText("state: saving")).toBeDefined();
    await settle();
    expect(screen.getByText("state: saved")).toBeDefined();
  });

  it("blur saves at once", () => {
    const save = vi.fn<RowSave>().mockResolvedValue({ ...ITEM, version: 2 });
    render(<Harness item={ITEM} save={save} />);
    act(() => {
      hook.setField("unit", "kg");
    });
    act(() => {
      hook.flush();
    });
    expect(save).toHaveBeenCalledWith({ version: 1, unit: "kg" });
  });

  it("keeps one request in flight; a newer edit waits and uses the new version", async () => {
    const first = deferred<PurchaseItemDto>();
    const save = vi
      .fn<RowSave>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...ITEM, version: 3 });
    render(<Harness item={ITEM} save={save} />);

    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    act(() => {
      hook.setField("unitCost", "38.00");
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(save).toHaveBeenCalledTimes(1);

    first.resolve({ ...ITEM, version: 2 });
    await settle();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith({ version: 2, unitCost: "38.00" });
    await settle();
    expect(screen.getByText("state: saved")).toBeDefined();
  });

  it("merges edits made during a save into one following request", async () => {
    const first = deferred<PurchaseItemDto>();
    const save = vi
      .fn<RowSave>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...ITEM, version: 3 });
    render(<Harness item={ITEM} save={save} />);
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    act(() => {
      hook.setField("unit", "kg");
      hook.setField("unitCost", "1.00");
    });
    first.resolve({ ...ITEM, version: 2 });
    await settle();
    expect(save).toHaveBeenLastCalledWith({
      version: 2,
      unit: "kg",
      unitCost: "1.00",
    });
  });

  it("on 409 shows the plain message and asks for the latest row", async () => {
    const onStale = vi.fn();
    const save = vi
      .fn<RowSave>()
      .mockRejectedValue(
        new ApiError(
          409,
          "CONFLICT",
          "Updated by someone else. Your change was not saved.",
        ),
      );
    render(<Harness item={ITEM} save={save} onStale={onStale} />);
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    await settle();
    expect(screen.getByText("state: conflict")).toBeDefined();
    expect(hook.message).toBe(
      "Updated by someone else. Your change was not saved.",
    );
    expect(onStale).toHaveBeenCalledTimes(1);
    // The refused edit is gone: nothing is retried on its own.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("the latest row replaces the shown values after a conflict", async () => {
    const save = vi
      .fn<RowSave>()
      .mockRejectedValue(
        new ApiError(409, "CONFLICT", "Updated by someone else."),
      );
    const { rerender } = render(<Harness item={ITEM} save={save} />);
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    await settle();
    rerender(
      <Harness item={{ ...ITEM, quantity: "9", version: 5 }} save={save} />,
    );
    expect(hook.values.quantity).toBe("9");
  });

  it("on a network failure keeps the value, shows Failed, and Retry sends it again", async () => {
    const save = vi
      .fn<RowSave>()
      .mockRejectedValueOnce(
        new ApiError(0, "NETWORK_ERROR", "Cannot reach the server."),
      )
      .mockResolvedValueOnce({ ...ITEM, version: 2 });
    render(<Harness item={ITEM} save={save} />);
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    await settle();
    expect(screen.getByText("state: failed")).toBeDefined();
    expect(hook.values.quantity).toBe("2");

    act(() => {
      hook.retry();
    });
    expect(save).toHaveBeenLastCalledWith({ version: 1, quantity: "2" });
    await settle();
    expect(screen.getByText("state: saved")).toBeDefined();
  });

  it("a validation error shows the server message and keeps the typed value", async () => {
    const save = vi
      .fn<RowSave>()
      .mockRejectedValue(
        new ApiError(400, "VALIDATION_ERROR", "Some fields are not valid.", [
          { field: "quantity", message: "Quantity must be more than 0." },
        ]),
      );
    render(<Harness item={ITEM} save={save} />);
    act(() => {
      hook.setField("quantity", "0");
      hook.flush();
    });
    await settle();
    expect(screen.getByText("state: failed")).toBeDefined();
    expect(hook.message).toBe("Quantity must be more than 0.");
    expect(hook.values.quantity).toBe("0");
  });

  it("a day locked meanwhile shows the server message and refreshes", async () => {
    const onStale = vi.fn();
    const save = vi
      .fn<RowSave>()
      .mockRejectedValue(
        new ApiError(409, "STATE_INVALID", "This day is locked."),
      );
    render(<Harness item={ITEM} save={save} onStale={onStale} />);
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    await settle();
    expect(hook.message).toBe("This day is locked.");
    expect(onStale).toHaveBeenCalledTimes(1);
  });

  it("nothing to save does nothing; a success tells the page to refresh totals", async () => {
    const onSaved = vi.fn();
    const save = vi.fn<RowSave>().mockResolvedValue({ ...ITEM, version: 2 });
    render(<Harness item={ITEM} save={save} onSaved={onSaved} />);
    act(() => {
      hook.flush();
    });
    expect(save).not.toHaveBeenCalled();
    act(() => {
      hook.setField("quantity", "2");
      hook.flush();
    });
    await settle();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
