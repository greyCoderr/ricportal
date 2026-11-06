/*
 * Icons adapted from Lucide (https://lucide.dev), ISC License.
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as
 * part of Feather (MIT). All other copyright (c) for Lucide are held by
 * Lucide Contributors 2022.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
import type { ReactNode } from "react";

// The client's mobile Figma frames use Lucide icons drawn with a 1px stroke
// (docs/components.md). RICPortal draws them at 1.5px for legibility
// (DEC-028). The stroke does not scale with the icon size.
export const ICON_STROKE = 1.5;

const STROKE = { vectorEffect: "non-scaling-stroke" } as const;

const SHAPES = {
  check: <path {...STROKE} d="M20 6 9 17l-5-5" />,
  "chevron-down": <path {...STROKE} d="m6 9 6 6 6-6" />,
  "circle-alert": (
    <>
      <circle {...STROKE} cx="12" cy="12" r="10" />
      <line {...STROKE} x1="12" x2="12" y1="8" y2="12" />
      <line {...STROKE} x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
  "circle-check": (
    <>
      <circle {...STROKE} cx="12" cy="12" r="10" />
      <path {...STROKE} d="m9 12 2 2 4-4" />
    </>
  ),
  eye: (
    <>
      <path
        {...STROKE}
        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      />
      <circle {...STROKE} cx="12" cy="12" r="3" />
    </>
  ),
  "loader-circle": <path {...STROKE} d="M21 12a9 9 0 1 1-6.219-8.56" />,
  "refresh-cw": (
    <>
      <path
        {...STROKE}
        d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      />
      <path {...STROKE} d="M21 3v5h-5" />
      <path
        {...STROKE}
        d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      />
      <path {...STROKE} d="M8 16H3v5" />
    </>
  ),
  x: (
    <>
      <path {...STROKE} d="M18 6 6 18" />
      <path {...STROKE} d="m6 6 12 12" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof SHAPES;
export const ICON_NAMES = Object.keys(SHAPES) as IconName[];

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  // Without a label the icon is decorative and hidden from screen readers.
  label?: string;
};

export function Icon({ name, size = 20, className, label }: IconProps) {
  const a11y =
    label === undefined
      ? { "aria-hidden": true as const }
      : { role: "img", "aria-label": label };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={className}
      {...a11y}
    >
      {SHAPES[name]}
    </svg>
  );
}
