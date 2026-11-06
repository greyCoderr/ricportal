import type { HTMLAttributes } from "react";
import { cx } from "./styles";

// panel: the mobile Figma card 361:2984 with the input radius and no shadow
// (its 9% shadow is not a token). stat: the Admin dashboard card 267:9808,
// 4px accent bottom border and the card shadow (DEC-028).
export type CardVariant = "panel" | "stat";

const VARIANT: Record<CardVariant, string> = {
  panel: "rounded-control border border-border-subtle bg-surface p-4",
  stat: "rounded-card border-b-4 border-accent bg-surface p-4 shadow-card",
};

type CardProps = HTMLAttributes<HTMLDivElement> & { variant?: CardVariant };

export function Card({ variant = "panel", className, ...rest }: CardProps) {
  return <div {...rest} className={cx(VARIANT[variant], className)} />;
}
