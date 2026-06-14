import type { Insight } from "../../domain/types";
import { Badge } from "./Badge";

type InsightCardProps = {
  insight: Insight;
};

const severityLabel = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

const severityTone = {
  low: "info",
  medium: "warning",
  high: "danger",
} as const;

export const InsightCard = ({ insight }: InsightCardProps) => (
  <article className="insight-card">
    <div className="insight-card-top">
      <h3>{insight.title}</h3>
      <Badge tone={severityTone[insight.severity]}>{severityLabel[insight.severity]}</Badge>
    </div>
    <p>{insight.description}</p>
    <strong>{insight.evidence}</strong>
  </article>
);
