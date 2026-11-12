import { useId, useState, type ReactNode } from "react";
import { cx, FOCUS_RING } from "./styles";

export type TabItem = { id: string; label: string; content: ReactNode };

// Simple tabs: every tab stays in the Tab order, and only the open panel is
// rendered, so a closed tab does not load its data.
export function Tabs({
  label,
  items,
  initial,
  variant = "line",
}: {
  label: string;
  items: TabItem[];
  initial?: string;
  // pill: the green tabs of the Admin dashboard's Recent Reports (Figma 267:9689).
  variant?: "line" | "pill";
}) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const base = useId();
  const current = items.find((item) => item.id === active) ?? items[0];
  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className={
          variant === "pill"
            ? "mb-2 flex flex-wrap gap-2 border-b border-border-subtle"
            : "mb-4 flex flex-wrap gap-1 border-b border-border-subtle"
        }
      >
        {items.map((item) => {
          const selected = item.id === current?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${base}-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              onClick={() => {
                setActive(item.id);
              }}
              className={cx(
                variant === "pill"
                  ? "-mb-px min-h-11 rounded-t-control border border-b-0 px-4 text-13 compact:min-h-7"
                  : "-mb-px min-h-11 border-b-2 px-3 text-15",
                variant === "pill"
                  ? selected
                    ? "border-accent bg-accent font-semibold text-primary-contrast"
                    : "border-border-subtle text-text-secondary"
                  : selected
                    ? "border-primary font-semibold text-text"
                    : "border-transparent text-text-secondary",
                FOCUS_RING,
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-${current?.id ?? ""}`}
      >
        {current?.content}
      </div>
    </div>
  );
}
