import type { Key, ReactNode } from "react";
import { cx } from "./styles";

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  caption: string;
  // Hide the caption visually when a heading above the table says the same.
  captionHidden?: boolean;
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
};

// A real table with ruled lines (DESIGN_LANGUAGE rule 1). It scrolls inside
// its own region, so the page never scrolls sideways.
export function Table<T>({
  caption,
  captionHidden = true,
  columns,
  rows,
  rowKey,
}: TableProps<T>) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
    >
      <table className="w-full border-collapse text-13">
        <caption
          className={captionHidden ? "sr-only" : "pb-2 text-left font-semibold"}
        >
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "px-3 py-2 font-medium whitespace-nowrap text-text-secondary",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border-subtle">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "px-3 py-2",
                    column.align === "right" && "text-right tabular-nums",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
