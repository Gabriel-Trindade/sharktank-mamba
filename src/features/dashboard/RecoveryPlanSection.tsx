import { Badge } from "../../components/ui/Badge";
import type { RecoveryAction } from "../../domain/types";

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
  media: "Media",
  alta: "Alta",
} as const;

export const RecoveryPlanSection = ({ actions }: RecoveryPlanSectionProps) => (
  <section className="dashboard-section">
    <div className="dashboard-section-header">
      <h2>Plano de recuperacao</h2>
      <p>Acoes priorizadas por regras para recuperar o faturamento</p>
    </div>
    <div className="recovery-list">
      {actions.length > 0 ? (
        actions.map((action) => (
          <article className="recovery-action" key={action.id}>
            <div className="recovery-priority">{action.priority}</div>
            <div className="recovery-content">
              <div className="recovery-top">
                <h3>{action.title}</h3>
                <Badge tone={complexityTone[action.complexity]}>{complexityLabel[action.complexity]}</Badge>
              </div>
              <dl className="recovery-details">
                <div>
                  <dt>Problema</dt>
                  <dd>{action.problem}</dd>
                </div>
                <div>
                  <dt>Evidencia</dt>
                  <dd>{action.evidence}</dd>
                </div>
                <div>
                  <dt>Acao</dt>
                  <dd>{action.action}</dd>
                </div>
                <div>
                  <dt>Impacto esperado</dt>
                  <dd>{action.expectedImpact}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))
      ) : (
        <p className="muted">Sem acoes prioritarias para os dados atuais.</p>
      )}
    </div>
  </section>
);
