import type { Key, ReactNode } from "react";
import { cx } from "./styles";

export type LedgerColumn<T> = {
  key: string;
  header: string;
  // Numbers are right-aligned with tabular figures (DESIGN_LANGUAGE rule 1).
  numeric?: boolean;
  render: (row: T) => ReactNode;
};

type LedgerTableProps<T> = {
  caption: string;
  columns: LedgerColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  total?: { label: string; value: ReactNode };
};

// Rows like the official forms (docs/ui-specs/ui-kit.md): thin ruled lines, and
// a total row with a single rule above and a double rule below. The table never
// adds or rounds: amounts come from the server.
export function LedgerTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  total,
}: LedgerTableProps<T>) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
    >
      <table className="w-full border-collapse text-13">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "px-2 py-2 font-medium whitespace-nowrap text-text-secondary",
                  column.numeric === true ? "text-right" : "text-left",
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
                    "px-2 py-1 align-top",
                    column.numeric === true && "text-right tabular-nums",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total !== undefined && (
          <tfoot>
            <tr className="border-t border-b-4 border-double border-t-border border-b-border font-semibold">
              <th
                scope="row"
                colSpan={Math.max(columns.length - 1, 1)}
                className="px-2 py-2 text-right font-semibold"
              >
                {total.label}
              </th>
              <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                {total.value}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
