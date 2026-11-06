import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export type HeadingLevel = 2 | 3 | 4;

type EmptyStateProps = {
  // Always written by the screen with real names, for example
  // "No students enrolled at {center} yet." Never "No data found".
  title: string;
  headingLevel?: HeadingLevel;
  icon?: IconName;
  action?: ReactNode;
  children?: ReactNode;
};

// Shown when a list or section has nothing yet (docs/ui-specs/ui-kit.md):
// left-aligned, no card, no illustration, no default text.
export function EmptyState({
  title,
  headingLevel = 2,
  icon,
  action,
  children,
}: EmptyStateProps) {
  const Heading = `h${String(headingLevel)}` as "h2" | "h3" | "h4";
  return (
    <div className="flex flex-col items-start gap-2">
      {icon !== undefined && (
        <Icon name={icon} size={24} className="text-text-muted" />
      )}
      <Heading className="text-16 font-semibold text-text">{title}</Heading>
      {children !== undefined && (
        <p className="text-15 text-text-secondary">{children}</p>
      )}
      {action}
    </div>
  );
}
