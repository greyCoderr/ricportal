import { manilaToday } from "@ricportal/shared";
import type { ReactNode } from "react";
import { formatDate, formatMenuName } from "../../../lib/format";

type Parents = { id: number; fullName: string }[];

function Tag({
  label,
  direction,
}: {
  label: string;
  direction: "left" | "right";
}) {
  return (
    <p
      className={`bg-tag py-4 text-13 font-bold tracking-label whitespace-nowrap text-primary-contrast ${
        direction === "right"
          ? "ric-tag-right -ml-4 pr-8 pl-4 lg:ml-0"
          : "ric-tag-left -mr-4 pr-4 pl-8 lg:mr-0"
      }`}
    >
      {label}
    </p>
  );
}

export function menuHeading(date: string, today = manilaToday()): string {
  return date === today ? "Today’s Menu" : `Menu for ${formatDate(date)}`;
}

// The panels under the calendar (Figma 166:1553, 393:1133): the dish on an arrow
// tag, the numbered parents on a pink card, and the Purchase Request. They stack
// under 1024 px in the Parent frame's order, where the tags reach the screen edge
// (the page's 16 px padding is taken back) and are 52 px high. The dish and the
// card hang from their tags by two short lines (.ric-hang). On a desktop the
// Purchase Request card keeps the Teacher frame's width, 762 of 1920 px.
export function DayPanels({
  date,
  menuName,
  parents,
  parentsLabel = "Assigned Parents",
  parentsAction,
  purchaseRequest,
}: {
  date: string;
  menuName: string | null;
  // Left out when the viewer has no list to show (the Admin).
  parents?: Parents | undefined;
  // The Parent frame says "Parents assigned"; the Teacher frame "Assigned Parents".
  parentsLabel?: string;
  parentsAction?: ReactNode;
  purchaseRequest: ReactNode;
}) {
  return (
    <div
      className={`mt-6 grid gap-6 lg:items-start ${
        // Without the parents panel the Purchase Request takes the wide column,
        // not the 14rem one the panel would have had.
        parents === undefined
          ? "lg:grid-cols-[minmax(0,1fr)_14rem]"
          : "lg:grid-cols-[14rem_minmax(0,1fr)_14rem]"
      }`}
    >
      <section className="flex flex-col items-start lg:order-3 lg:items-end">
        <Tag label={menuHeading(date)} direction="right" />
        <p className="ric-hang mt-2 border border-border bg-tag-tint px-3 py-0.5 text-13 font-medium">
          {menuName === null ? "No menu" : formatMenuName(menuName)}
        </p>
      </section>

      <section
        aria-labelledby="purchase-request-title"
        className="min-w-0 rounded-card border border-border-subtle bg-surface p-3 shadow-panel lg:order-2 lg:w-full lg:max-w-[47.5rem] lg:justify-self-center lg:p-4"
      >
        <h2
          id="purchase-request-title"
          className="mb-3 text-center text-15 font-medium tracking-label"
        >
          Purchase Request
        </h2>
        {purchaseRequest}
      </section>

      {parents !== undefined && (
        <section className="flex flex-col items-end lg:order-1 lg:items-start">
          <Tag label={parentsLabel} direction="left" />
          <div className="ric-hang mt-2 w-fit max-w-60 min-w-40 border border-border bg-tag-tint p-3 shadow-panel">
            {parents.length === 0 ? (
              <p className="text-13">No parents assigned yet.</p>
            ) : (
              <ol className="flex list-inside list-decimal flex-col gap-2 text-13 tracking-label">
                {parents.map((parent) => (
                  <li key={parent.id}>{parent.fullName}</li>
                ))}
              </ol>
            )}
          </div>
          {parentsAction !== undefined && (
            <div className="mt-2">{parentsAction}</div>
          )}
        </section>
      )}
    </div>
  );
}
