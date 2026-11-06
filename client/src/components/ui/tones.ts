import type { IconName } from "./icons";

// Message tones shared by Banner and Toast (docs/ui-specs/ui-kit.md): a soft
// fill, a 4px left border in the hue (decorative; the words carry the
// meaning) and the AA text token for the text and the icon (DEC-023).
export type MessageTone = "info" | "success" | "warning" | "danger";

export const MESSAGE_TONES: Record<
  MessageTone,
  { classes: string; icon: IconName }
> = {
  info: {
    classes: "bg-info-soft border-info text-info-text",
    icon: "circle-alert",
  },
  success: {
    classes: "bg-success-soft border-success text-success",
    icon: "circle-check",
  },
  warning: {
    classes: "bg-warning-soft border-warning text-warning-text",
    icon: "circle-alert",
  },
  danger: {
    classes: "bg-danger-soft border-danger text-danger-text",
    icon: "circle-alert",
  },
};

export const MESSAGE_BOX = "rounded-control border-l-4 p-3 text-15";
