import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-24 font-semibold">{title}</h1>
        {description !== undefined && (
          <p className="text-15 text-text-secondary">{description}</p>
        )}
      </div>
      {actions !== undefined && (
        <div className="flex flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}
