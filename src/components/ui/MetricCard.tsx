import type { ReactNode } from "react";
import clsx from "clsx";
import { Tooltip } from "./Tooltip";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  tooltip?: string;
};

export const MetricCard = ({ label, value, detail, tone = "neutral", tooltip }: MetricCardProps) => (
  <article className={clsx("metric-card", `metric-card-${tone}`)}>
    <span className="metric-label">
      {label}
      {tooltip && <Tooltip content={tooltip} />}
    </span>
    <strong className="metric-value">{value}</strong>
    {detail ? <span className="metric-detail">{detail}</span> : null}
  </article>
);
