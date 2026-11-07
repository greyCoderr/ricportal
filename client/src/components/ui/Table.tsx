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
  // Under 768 px each row becomes a card, as the client's phone frames show.
  cardsOnPhone?: boolean;
  // For a table too wide for a tablet: the cards stay until 1024 px.
  cardsUntilDesktop?: boolean;
  rowClassName?: (row: T) => string;
};

// A real table with ruled lines (DESIGN_LANGUAGE rule 1). It scrolls inside
// its own region, so the page never scrolls sideways.
export function Table<T>({
  caption,
  captionHidden = true,
  columns,
  rows,
  rowKey,
  cardsOnPhone = false,
  cardsUntilDesktop = false,
  rowClassName,
}: TableProps<T>) {
  return (
    <>
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className={cx(
          "overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text",
          cardsOnPhone &&
            (cardsUntilDesktop ? "hidden lg:block" : "hidden md:block"),
        )}
      >
        <table className="w-full border-collapse text-13">
          <caption
            className={
              captionHidden ? "sr-only" : "pb-2 text-left font-semibold"
            }
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
              <tr
                key={rowKey(row)}
                className={cx(
                  "border-b border-border-subtle",
                  rowClassName?.(row),
                )}
              >
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
      {cardsOnPhone && (
        <ul
          aria-label={caption}
          className={cx(
            "flex flex-col gap-3",
            cardsUntilDesktop ? "lg:hidden" : "md:hidden",
          )}
        >
          {rows.map((row) => (
            <li
              key={rowKey(row)}
              className={cx(
                "rounded-control border border-border-subtle p-3",
                rowClassName?.(row),
              )}
            >
              <dl className="flex flex-col gap-2">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-wrap items-center justify-between gap-x-3"
                  >
                    <dt className="text-12 text-text-secondary">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 text-13">{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
