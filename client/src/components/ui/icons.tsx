/*
 * Icons adapted from Lucide (https://lucide.dev), lucide-static 1.70.0.
 * Shapes checked against that version on 2026-11-06 (docs/components.md).
 *
 * ISC License
 *
 * Copyright (c) 2026 Lucide Icons and Contributors
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
 *
 * ---
 *
 * The icons check, chevron-down, download, lock, log-out, plus, search, trash-2,
 * upload and x are derived from the Feather project:
 *
 * The MIT License (MIT) (for the icons listed above)
 *
 * Copyright (c) 2013-present Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import type { ReactNode } from "react";

// The client's mobile Figma frames use Lucide icons drawn with a 1px stroke
// (docs/components.md). RICPortal draws them at 1.5px for legibility
// (DEC-028). The stroke does not scale with the icon size.
export const ICON_STROKE = 1.5;

const STROKE = { vectorEffect: "non-scaling-stroke" } as const;

const SHAPES = {
  "calendar-days": (
    <>
      <path {...STROKE} d="M8 2v3" />
      <path {...STROKE} d="M16 2v3" />
      <rect {...STROKE} x="3" y="3" width="18" height="18" rx="2" />
      <path {...STROKE} d="M3 9h18" />
      <path {...STROKE} d="M8 13h.01" />
      <path {...STROKE} d="M12 13h.01" />
      <path {...STROKE} d="M16 13h.01" />
      <path {...STROKE} d="M8 17h.01" />
      <path {...STROKE} d="M12 17h.01" />
      <path {...STROKE} d="M16 17h.01" />
    </>
  ),
  check: (
    <>
      <path {...STROKE} d="M20 6 9 17l-5-5" />
    </>
  ),
  "chevron-down": (
    <>
      <path {...STROKE} d="m6 9 6 6 6-6" />
    </>
  ),
  "chart-column": (
    <>
      <path {...STROKE} d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path {...STROKE} d="M18 17V9" />
      <path {...STROKE} d="M13 17V5" />
      <path {...STROKE} d="M8 17v-3" />
    </>
  ),
  clock: (
    <>
      <circle {...STROKE} cx="12" cy="12" r="10" />
      <path {...STROKE} d="M12 6v6l4 2" />
    </>
  ),
  mail: (
    <>
      <path {...STROKE} d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect {...STROKE} x="2" y="4" width="20" height="16" rx="2" />
    </>
  ),
  phone: (
    <path
      {...STROKE}
      d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
    />
  ),
  "shield-check": (
    <>
      <path
        {...STROKE}
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      />
      <path {...STROKE} d="m9 12 2 2 4-4" />
    </>
  ),
  smartphone: (
    <>
      <rect {...STROKE} width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path {...STROKE} d="M12 18h.01" />
    </>
  ),
  user: (
    <>
      <path {...STROKE} d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle {...STROKE} cx="12" cy="7" r="4" />
    </>
  ),
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
      <path {...STROKE} d="m16 9-5.5 5.5L8 12" />
    </>
  ),
  download: (
    <>
      <path {...STROKE} d="M12 15V3" />
      <path {...STROKE} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path {...STROKE} d="m7 10 5 5 5-5" />
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
  "file-text": (
    <>
      <path
        {...STROKE}
        d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
      />
      <path {...STROKE} d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path {...STROKE} d="M10 9H8" />
      <path {...STROKE} d="M16 13H8" />
      <path {...STROKE} d="M16 17H8" />
    </>
  ),
  house: (
    <>
      <path {...STROKE} d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path
        {...STROKE}
        d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      />
    </>
  ),
  inbox: (
    <>
      <polyline {...STROKE} points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path
        {...STROKE}
        d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      />
    </>
  ),
  "loader-circle": (
    <>
      <path {...STROKE} d="M21 12a9 9 0 1 1-6.219-8.56" />
    </>
  ),
  lock: (
    <>
      <rect {...STROKE} width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path {...STROKE} d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  "lock-open": (
    <>
      <rect {...STROKE} width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path {...STROKE} d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>
  ),
  "log-out": (
    <>
      <path {...STROKE} d="m16 17 5-5-5-5" />
      <path {...STROKE} d="M21 12H9" />
      <path {...STROKE} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </>
  ),
  "map-pin": (
    <>
      <path
        {...STROKE}
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      />
      <circle {...STROKE} cx="12" cy="10" r="3" />
    </>
  ),
  menu: (
    <>
      <path {...STROKE} d="M4 5h16" />
      <path {...STROKE} d="M4 12h16" />
      <path {...STROKE} d="M4 19h16" />
    </>
  ),
  pencil: (
    <>
      <path
        {...STROKE}
        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      />
      <path {...STROKE} d="m15 5 4 4" />
    </>
  ),
  plus: (
    <>
      <path {...STROKE} d="M5 12h14" />
      <path {...STROKE} d="M12 5v14" />
    </>
  ),
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
  search: (
    <>
      <path {...STROKE} d="m21 21-4.34-4.34" />
      <circle {...STROKE} cx="11" cy="11" r="8" />
    </>
  ),
  "trash-2": (
    <>
      <path {...STROKE} d="M10 11v6" />
      <path {...STROKE} d="M14 11v6" />
      <path {...STROKE} d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path {...STROKE} d="M3 6h18" />
      <path {...STROKE} d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  upload: (
    <>
      <path {...STROKE} d="M12 3v12" />
      <path {...STROKE} d="m17 8-5-5-5 5" />
      <path {...STROKE} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </>
  ),
  users: (
    <>
      <path {...STROKE} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path {...STROKE} d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path {...STROKE} d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle {...STROKE} cx="9" cy="7" r="4" />
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
  // Only for a single approved use: the checkbox check mark is 2px
  // (docs/ui-specs/ui-kit.md). Everything else uses ICON_STROKE.
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  className,
  label,
  strokeWidth = ICON_STROKE,
}: IconProps) {
  const a11y =
    label === undefined
      ? { "aria-hidden": true as const }
      : { role: "img", "aria-label": label };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      // In rem, so an icon follows the density scale (D2). 16 is the base size.
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      data-icon={name}
      className={className}
      {...a11y}
    >
      {SHAPES[name]}
    </svg>
  );
}
