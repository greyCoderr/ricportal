import type { ReactNode } from "react";
import avatar from "../assets/avatar-placeholder.png";

export type ProfileDetail = { label: string; value: string };

export const NOT_SET = "Not set";

function Detail({ label, value }: ProfileDetail) {
  return (
    <div>
      <dt className="text-11 tracking-label text-text-secondary">{label}</dt>
      <dd className="mt-1 text-12 tracking-label break-words">{value}</dd>
    </div>
  );
}

// The top of the Profile frame (88:695): the picture, the name with a status
// badge and the contact lines, then columns of details split by a thin line. The
// signed-in user and the Admin's View Profile use the same layout (D8, D9).
export function ProfileCard({
  name,
  badge,
  contacts,
  columns,
}: {
  name: string;
  badge: ReactNode;
  contacts: string[];
  columns: ProfileDetail[][];
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <img
        src={avatar}
        alt=""
        className="size-[7.5rem] shrink-0 rounded-full object-cover lg:size-[10.375rem]"
      />
      <div className="min-w-0 md:w-64 md:shrink-0">
        <p className="text-20 font-bold tracking-label">{name}</p>
        <div className="mt-2">{badge}</div>
        <ul className="mt-3 flex flex-col gap-2 text-11 tracking-label">
          {contacts.map((line) => (
            <li key={line} className="break-words">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {columns.map((column) => (
          <dl
            key={column[0]?.label}
            className="flex min-w-0 flex-col gap-4 md:border-l md:border-border-subtle md:pl-6"
          >
            {column.map((detail) => (
              <Detail key={detail.label} {...detail} />
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
}
