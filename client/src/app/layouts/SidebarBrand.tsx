import emblem from "../../assets/ric-emblem.png";

export const EMBLEM_ALT = "Rural Improvement Club emblem";

// One header for every role (D5 of docs/POLISH_PLAN_2.md). The proportions are
// the Teacher frame's (175:1023): a 54 px logo beside the name and the address.
export function SidebarBrand() {
  return (
    <div
      data-testid="sidebar-brand"
      className="flex shrink-0 items-center gap-3 border-b border-primary py-5 pr-1 pl-6 text-nav-text"
    >
      <img
        src={emblem}
        alt={EMBLEM_ALT}
        className="size-[3.375rem] shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="text-20 tracking-label">
          <span className="text-primary">RIC</span>Portal
        </p>
        <p className="text-12 tracking-label whitespace-nowrap compact:text-11">
          Rural Improvement Club
        </p>
        <p className="text-12 tracking-label whitespace-nowrap compact:text-11">
          Libmanan, Camarines Sur
        </p>
      </div>
    </div>
  );
}
