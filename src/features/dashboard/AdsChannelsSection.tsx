import { Card } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { formatCurrency, formatPercent } from "../../domain/formatters";
import type { AnalysisResult, SellerScenario } from "../../domain/types";

type AdsChannelsSectionProps = {
  scenario: SellerScenario;
  result: AnalysisResult;
};

export const AdsChannelsSection = ({ scenario, result }: AdsChannelsSectionProps) => (
  <div className="section-stack">
    <div className="dashboard-grid">
      <MetricCard label="Investimento" value={formatCurrency(scenario.ads.investimentoAds)} detail="Shopee Ads" />
      <MetricCard label="CTR" value={formatPercent(result.overview.ctr)} detail="Cliques / impressões" />
      <MetricCard label="Clique -> pedido" value={formatPercent(result.overview.clickToOrderConversion)} detail="Pedidos Ads / cliques" />
      <MetricCard label="CPC estimado" value={formatCurrency(result.overview.cpc)} detail="Investimento / cliques" />
      <MetricCard
        label="Verba até TACOS"
        value={formatCurrency(result.overview.adsBudgetRemaining)}
        detail={`Teto ${formatCurrency(result.overview.availableAdsBudget)}`}
        tone={result.overview.adsBudgetRemaining > 0 ? "info" : "danger"}
      />
    </div>

    <Card title="Fluxo de Ads" description="Leitura do caminho entre investimento, entrega, conversão e receita.">
      <div className="funnel">
        <div className="funnel-step">
          <span className="funnel-label">Investimento</span>
          <strong className="funnel-value">{formatCurrency(scenario.ads.investimentoAds)}</strong>
        </div>
        <div className="funnel-step">
          <span className="funnel-label">Entrega</span>
          <strong className="funnel-value">{scenario.ads.impressoes.toLocaleString("pt-BR")}</strong>
        </div>
        <div className="funnel-step">
          <span className="funnel-label">Conversão</span>
          <strong className="funnel-value">{scenario.ads.pedidosAds.toLocaleString("pt-BR")} pedidos</strong>
        </div>
        <div className="funnel-step">
          <span className="funnel-label">Receita Ads</span>
          <strong className="funnel-value">{formatCurrency(scenario.ads.vendasAds)}</strong>
        </div>
      </div>
    </Card>

    <Card title="Canais de venda">
      <div className="dashboard-grid">
        <MetricCard label="Card produto" value={formatCurrency(scenario.traffic.vendasCardProduto)} />
        <MetricCard label="Lives" value={formatCurrency(scenario.traffic.vendasLives)} />
        <MetricCard label="Vídeo vendedor" value={formatCurrency(scenario.traffic.vendasVideoVendedor)} />
        <MetricCard label="Afiliado" value={formatCurrency(scenario.traffic.vendasAfiliado)} />
      </div>
    </Card>
  </div>
);
