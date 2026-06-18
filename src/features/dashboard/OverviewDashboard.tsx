import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { InsightCard } from "../../components/ui/InsightCard";
import { MetricCard } from "../../components/ui/MetricCard";
import { formatCurrency, formatInteger, formatPercent } from "../../domain/formatters";
import type { AnalysisResult, SellerScenario } from "../../domain/types";

type OverviewDashboardProps = {
  scenario: SellerScenario;
  result: AnalysisResult;
};

export const OverviewDashboard = ({ scenario, result }: OverviewDashboardProps) => {
  const [showAllInsights, setShowAllInsights] = useState(false);
  const targetProgress = Math.min(100, Math.max(0, result.overview.targetProgressPct));

  const highInsights = result.insights.filter((i) => i.severity === "high");
  const otherCount = result.insights.length - highInsights.length;
  const visibleInsights = showAllInsights ? result.insights : highInsights;

  return (
    <div className="section-stack">
      <section className="recovery-target-panel" aria-label="Caminho até a meta de faturamento">
        <div className="recovery-target-copy">
          <span className="section-eyebrow">Meta da conta</span>
          <h2>Caminho até {formatCurrency(scenario.config.metaFaturamento)}</h2>
          <strong>{formatCurrency(result.overview.revenueGapToTarget)} faltando</strong>
          <p>
            São {formatInteger(result.overview.ordersNeededToTarget)} pedidos no ticket atual para fechar o gap —
            um ritmo de {formatCurrency(result.overview.dailyRevenueNeededToTarget)} por dia
            (~{formatInteger(result.overview.dailyOrdersNeededToTarget)} pedidos/dia).
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
              <span>Saldo Ads (meta)</span>
              <strong>
                {result.overview.adsBudgetRemaining >= 0
                  ? formatCurrency(result.overview.adsBudgetRemaining)
                  : `−${formatCurrency(Math.abs(result.overview.adsBudgetRemaining))}`}
              </strong>
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
          <h2>Visão geral</h2>
          <p>Indicadores principais dos últimos 30 dias</p>
        </div>
        <div className="dashboard-grid">
          <MetricCard
            label="Vendas 30d"
            value={formatCurrency(result.overview.sales30d)}
            detail={
              result.overview.salesGrowthPct > 0
                ? `Alta ${formatPercent(result.overview.salesGrowthPct)} vs. período de referência`
                : result.overview.salesDropPct > 0
                  ? `Queda ${formatPercent(result.overview.salesDropPct)} vs. período de referência`
                  : "Estável vs. período de referência"
            }
            tone={result.overview.salesDropPct > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Compradores"
            value={formatInteger(result.overview.buyers)}
            detail={`Conversão ${formatPercent(result.overview.visitToBuyerConversion)}`}
            tone={result.overview.visitToBuyerConversion < 5 ? "danger" : "success"}
            tooltip="De cada 100 pessoas que visitaram sua loja, quantas fizeram uma compra. Conversão de 3% significa que 97 foram embora sem comprar — abaixo de 5% acende o alerta."
          />
          <MetricCard
            label="Dependência Ads"
            value={formatPercent(result.overview.adDependencyPct)}
            detail="Atribuição direta (tráfego)"
            tone={result.overview.adDependencyPct >= 60 ? "danger" : "info"}
            tooltip="Quanto das suas vendas vem de anúncios pagos, pela atribuição direta das fontes de tráfego. Tende a ser MENOR que a 'Receita Ads' do painel, que usa uma janela de atribuição mais ampla. 70% significa que se você pausar os anúncios hoje, quase todas as vendas somem. O saudável é ter uma base de vendas orgânicas também, sem depender de pagar por cada clique."
          />
          <MetricCard
            label="TACOS usado"
            value={formatPercent(result.overview.tacosUsedPct)}
            detail={`Limite ${formatPercent(scenario.config.tacosMaximoPct)}`}
            tone={result.overview.tacosUsedPct > scenario.config.tacosMaximoPct ? "danger" : "success"}
            tooltip={`De cada R$100 que você vendeu, quanto foi gasto em anúncios. Ex: TACOS de 16,6% = você gastou R$16,60 para gerar R$100 em vendas. Seu limite configurado é ${scenario.config.tacosMaximoPct}% — acima disso, o anúncio está corroendo sua margem.`}
          />
          {scenario.account.vendasSemDesconto !== undefined && (
            <MetricCard
              label="Descontos Shopee"
              value={formatPercent(result.overview.shopeeDiscountSharePct)}
              detail={`${formatCurrency(result.overview.shopeeDiscountValue)} do faturamento bruto`}
              tone={result.overview.shopeeDiscountSharePct >= 15 ? "danger" : "info"}
              tooltip="Quanto do seu faturamento bruto veio de descontos subsidiados pela Shopee (bruto menos as vendas sem desconto da Shopee). Quanto maior, mais o seu resultado depende dessas campanhas da plataforma para acontecer."
            />
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Leitura automática</h2>
          <p>Diagnóstico gerado por regras com base nos dados informados</p>
        </div>
        <div className="insight-grid">
          {visibleInsights.length > 0 ? (
            visibleInsights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
          ) : (
            <p className="muted">Nenhum gargalo crítico encontrado nos dados atuais.</p>
          )}
        </div>
        {!showAllInsights && otherCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setShowAllInsights(true)}>
            Ver {otherCount} {otherCount === 1 ? "aviso adicional" : "avisos adicionais"}
          </Button>
        )}
        {showAllInsights && (
          <Button size="sm" variant="ghost" onClick={() => setShowAllInsights(false)}>
            Mostrar menos
          </Button>
        )}
      </section>
    </div>
  );
};
