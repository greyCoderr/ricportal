import type { ReactNode } from "react";

// The client's status pills (Figma 267:9763 to 267:9770): 24% tint fill, no
// border, Medium 12, with the AA text colors (DEC-023).
export type BadgeTone = "success" | "info" | "warning" | "danger";

const TONE: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

type BadgeProps = { tone: BadgeTone; children: ReactNode };

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-card px-3 py-0.5 text-12 font-medium whitespace-nowrap ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
