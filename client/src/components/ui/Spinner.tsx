import { Icon } from "./icons";
import { cx } from "./styles";

type SpinnerProps = {
  // With a label the spinner is announced as a status; without one it is
  // decorative (for example inside a busy Button, which sets aria-busy).
  label?: string;
  size?: number;
  className?: string;
};

// Turns while busy; stops for people who ask for reduced motion.
export function Spinner({ label, size = 16, className }: SpinnerProps) {
  const icon = (
    <Icon
      name="loader-circle"
      size={size}
      className={cx("animate-spin motion-reduce:animate-none", className)}
    />
  );
  if (label === undefined) {
    return icon;
  }
  return (
    <span role="status" aria-label={label} className="inline-flex">
      {icon}
    </span>
  );
}
