import type { ReactNode } from "react";
import { cx } from "./styles";

// A still placeholder block (no pulse: DESIGN_LANGUAGE rule 8). Hidden from
// screen readers; the surrounding SkeletonGroup says what is loading.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx("rounded-cell bg-skeleton", className)}
    />
  );
}

type SkeletonGroupProps = {
  // Visually hidden text read by screen readers, for example
  // "Loading the students of {center}...".
  label?: string;
  className?: string;
  children: ReactNode;
};

// Every container of Skeleton blocks uses this (DEC-028; checked by
// client/test/skeleton-usage.test.ts).
export function SkeletonGroup({
  label = "Loading...",
  className,
  children,
}: SkeletonGroupProps) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
