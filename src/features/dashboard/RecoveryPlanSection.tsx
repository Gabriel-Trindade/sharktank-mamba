import clsx from "clsx";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import type { RecoveryAction } from "../../domain/types";

type ComplexityFilter = "all" | "baixa" | "media" | "alta";

type RecoveryPlanSectionProps = {
  actions: RecoveryAction[];
};

const complexityTone = {
  baixa: "success",
  media: "warning",
  alta: "danger",
} as const;

const complexityLabel = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
} as const;

// Faixa de urgência da ação (1 = parar o sangramento agora ... 5 = otimização fina).
const urgencyLabel: Record<RecoveryAction["priority"], string> = {
  1: "Crítico",
  2: "Urgente",
  3: "Médio",
  4: "Planejado",
  5: "Otimização",
};

const filterOptions: { value: ComplexityFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

export const RecoveryPlanSection = ({ actions }: RecoveryPlanSectionProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>("all");

  // As ações chegam já ordenadas da mais urgente para a menos urgente.
  // O posto (01, 02, ...) é global, então cada ação mantém seu lugar mesmo quando a lista é filtrada.
  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    actions.forEach((action, index) => map.set(action.id, index + 1));
    return map;
  }, [actions]);

  const filteredActions =
    complexityFilter === "all" ? actions : actions.filter((a) => a.complexity === complexityFilter);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <h2>Plano de recuperação</h2>
        <p>Ações priorizadas por regras, da mais urgente para a menos urgente</p>
      </div>

      <div className="tabs">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={clsx("tab-button", complexityFilter === opt.value && "is-active")}
            onClick={() => setComplexityFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredActions.length > 0 ? (
        <ol className="recovery-list">
          {filteredActions.map((action) => {
            const isExpanded = expandedId === action.id;
            const rank = rankById.get(action.id) ?? action.priority;
            return (
              <li className={clsx("recovery-action", `recovery-action-p${action.priority}`)} key={action.id}>
                <div className="recovery-rank">
                  <span className="recovery-rank-number">{String(rank).padStart(2, "0")}</span>
                  <span className="recovery-rank-tier">{urgencyLabel[action.priority]}</span>
                </div>
                <div className="recovery-content">
                  <div className="recovery-top">
                    <h3>{action.title}</h3>
                    <div className="recovery-top-meta">
                      <Badge tone={complexityTone[action.complexity]}>
                        {complexityLabel[action.complexity]}
                      </Badge>
                      <Button
                        className="recovery-toggle"
                        size="sm"
                        variant="ghost"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : action.id)}
                      >
                        {isExpanded ? "Ver menos" : "Ver detalhes"}
                      </Button>
                    </div>
                  </div>
                  <dl className="recovery-details">
                    <div>
                      <dt>Problema</dt>
                      <dd>{action.problem}</dd>
                    </div>
                    <div>
                      <dt>Impacto esperado</dt>
                      <dd>{action.expectedImpact}</dd>
                    </div>
                  </dl>
                  {isExpanded && (
                    <dl className="recovery-details">
                      <div>
                        <dt>Evidência</dt>
                        <dd>{action.evidence}</dd>
                      </div>
                      <div>
                        <dt>Ação</dt>
                        <dd>{action.action}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="muted">
          {complexityFilter === "all"
            ? "Sem ações prioritárias para os dados atuais."
            : "Nenhuma ação com essa complexidade."}
        </p>
      )}
    </section>
  );
};
