import type { ReactNode } from "react";
import { Icon } from "./icons";
import { cx } from "./styles";
import { MESSAGE_BOX, MESSAGE_TONES, type MessageTone } from "./tones";

type BannerProps = {
  tone: MessageTone;
  title?: string;
  // An optional Button (size sm) for one action.
  action?: ReactNode;
  children: ReactNode;
};

// A message for a whole page or section that stays until its condition ends
// (docs/ui-specs/ui-kit.md). Info and success are polite status messages;
// warning and danger are alerts.
export function Banner({ tone, title, action, children }: BannerProps) {
  const style = MESSAGE_TONES[tone];
  const role = tone === "info" || tone === "success" ? "status" : "alert";
  return (
    <div role={role} className={cx("flex gap-3", MESSAGE_BOX, style.classes)}>
      <Icon name={style.icon} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-2">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
        {action !== undefined && <div>{action}</div>}
      </div>
    </div>
  );
}
