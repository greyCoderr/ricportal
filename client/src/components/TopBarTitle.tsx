import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

// The top bar's title slot (Plan 4 D6): Figma 267:9689 and 268:11404 put the
// page title in the header row. AppShell provides the slot element; it is
// shown from 1024 px, where the top bar no longer shows the brand.
export const TopBarSlotContext = createContext<HTMLElement | null>(null);

const TITLE = "text-24 font-bold lg:text-42";

// The page title, with optional compact controls beside it (D6: the Calendar's
// center choice), in the top bar on a desktop and above the page below that.
// Outside the shell (tests, sign-in pages) it is a plain heading.
export function TopBarTitle({
  children,
  actions,
}: {
  children: string;
  actions?: ReactNode;
}) {
  const slot = useContext(TopBarSlotContext);
  if (slot === null) {
    return (
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className={TITLE}>{children}</h1>
        {actions}
      </div>
    );
  }
  return (
    <>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 lg:hidden">
        <h1 className={TITLE}>{children}</h1>
        {actions}
      </div>
      {createPortal(
        <div className="flex min-w-0 items-center gap-6">
          <h1 className={`truncate ${TITLE}`}>{children}</h1>
          {actions}
        </div>,
        slot,
      )}
    </>
  );
}
