import { InsightCard } from "../../components/ui/InsightCard";
import { MetricCard } from "../../components/ui/MetricCard";
import { formatCurrency, formatInteger, formatPercent } from "../../domain/formatters";
import type { AnalysisResult, SellerScenario } from "../../domain/types";

type OverviewDashboardProps = {
  scenario: SellerScenario;
  result: AnalysisResult;
};

export const OverviewDashboard = ({ scenario, result }: OverviewDashboardProps) => {
  const targetProgress = Math.min(100, Math.max(0, result.overview.targetProgressPct));

  return (
    <div className="section-stack">
      <section className="recovery-target-panel" aria-label="Caminho até a meta de faturamento">
        <div className="recovery-target-copy">
          <span className="section-eyebrow">Meta da conta</span>
          <h2>Caminho até {formatCurrency(scenario.config.metaFaturamento)}</h2>
          <strong>{formatCurrency(result.overview.revenueGapToTarget)} faltando</strong>
          <p>
            O ritmo necessário é de {formatCurrency(result.overview.dailyRevenueNeededToTarget)} por dia,
            equivalente a {formatInteger(result.overview.ordersNeededToTarget)} pedidos no ticket atual.
          </p>
        </div>

        <div className="recovery-target-meter">
          <div
            className="recovery-progress"
            role="progressbar"
            aria-label="Progresso até a meta"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(targetProgress)}
          >
            <span style={{ width: `${targetProgress}%` }} />
          </div>
          <div className="target-stat-grid">
            <div className="target-stat">
              <span>Progresso</span>
              <strong>{formatPercent(result.overview.targetProgressPct)}</strong>
            </div>
            <div className="target-stat">
              <span>Pedidos/dia</span>
              <strong>{formatInteger(result.overview.dailyOrdersNeededToTarget)}</strong>
            </div>
            <div className="target-stat">
              <span>Verba Ads restante</span>
              <strong>{formatCurrency(result.overview.adsBudgetRemaining)}</strong>
            </div>
            <div className="target-stat">
              <span>Margem estimada</span>
              <strong>{formatCurrency(result.overview.contributionMarginValue)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Visão geral da operação</h2>
          <p>Métricas principais dos últimos 30 dias</p>
        </div>
        <div className="dashboard-grid">
          <MetricCard
            label="Vendas 30d"
            value={formatCurrency(result.overview.sales30d)}
            detail={`Queda ${formatPercent(result.overview.salesDropPct)}`}
            tone={result.overview.salesDropPct > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Pedidos"
            value={formatInteger(result.overview.orders30d)}
            detail={`Queda ${formatPercent(result.overview.ordersDropPct)}`}
            tone={result.overview.ordersDropPct > 0 ? "warning" : "success"}
          />
          <MetricCard
            label="Cancelamentos"
            value={formatInteger(result.overview.cancellations30d)}
            detail={`Crescimento ${formatPercent(result.overview.cancellationGrowthPct)}`}
            tone={result.overview.cancellationGrowthPct > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Ticket médio"
            value={formatCurrency(result.overview.averageTicket)}
            detail={`${formatInteger(result.overview.visitors)} visitantes`}
          />
          <MetricCard
            label="Compradores"
            value={formatInteger(result.overview.buyers)}
            detail={`Conversão ${formatPercent(result.overview.visitToBuyerConversion)}`}
            tone={result.overview.visitToBuyerConversion < 5 ? "danger" : "success"}
          />
          <MetricCard
            label="Dependência Ads"
            value={formatPercent(result.overview.adDependencyPct)}
            detail="Vendas Shopee Ads / total"
            tone={result.overview.adDependencyPct >= 60 ? "danger" : "info"}
          />
          <MetricCard
            label="ROAS"
            value={result.overview.roas.toFixed(2)}
            detail={`CTR ${formatPercent(result.overview.ctr)}`}
            tone={result.overview.roas < 4 ? "warning" : "success"}
          />
          <MetricCard
            label="TACOS usado"
            value={formatPercent(result.overview.tacosUsedPct)}
            detail={`Limite ${formatPercent(scenario.config.tacosMaximoPct)}`}
            tone={result.overview.tacosUsedPct > scenario.config.tacosMaximoPct ? "danger" : "success"}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Leitura automática</h2>
          <p>Diagnóstico gerado por regras com base nos dados informados</p>
        </div>
        <div className="insight-grid">
          {result.insights.length > 0 ? (
            result.insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
          ) : (
            <p className="muted">Nenhum gargalo crítico encontrado nos dados atuais.</p>
          )}
        </div>
      </section>
    </div>
  );
};
