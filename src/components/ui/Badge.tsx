import type { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export const Badge = ({ className, tone = "neutral", ...props }: BadgeProps) => (
  <span className={clsx("ui-badge", `ui-badge-${tone}`, className)} {...props} />
);
