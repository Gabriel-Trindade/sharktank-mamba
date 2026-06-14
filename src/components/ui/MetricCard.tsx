import type { ReactNode } from "react";
import clsx from "clsx";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export const MetricCard = ({ label, value, detail, tone = "neutral" }: MetricCardProps) => (
  <article className={clsx("metric-card", `metric-card-${tone}`)}>
    <span className="metric-label">{label}</span>
    <strong className="metric-value">{value}</strong>
    {detail ? <span className="metric-detail">{detail}</span> : null}
  </article>
);
