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
      <MetricCard
        label="CTR"
        value={formatPercent(result.overview.ctr)}
        detail="Cliques / impressões"
        tooltip="De cada 100 vezes que seu anúncio apareceu na Shopee, quantas vezes alguém clicou. CTR mais alto = anúncio mais atrativo. Muito baixo pode indicar foto ou título fraco."
      />
      <MetricCard
        label="Clique → pedido"
        value={formatPercent(result.overview.clickToOrderConversion)}
        detail="Pedidos Ads / cliques"
        tooltip="De cada 100 pessoas que clicaram no anúncio, quantas fizeram um pedido. Número baixo pode indicar problema na página do produto: foto, preço, descrição ou avaliações insuficientes."
      />
      <MetricCard
        label="CPC estimado"
        value={formatCurrency(result.overview.cpc)}
        detail="Investimento / cliques"
        tooltip="Custo por Clique — quanto você pagou em média por cada pessoa que clicou no seu anúncio. Quanto menor, mais eficiente é o seu Ads."
      />
      <MetricCard
        label="Saldo Ads vs. meta"
        value={
          result.overview.adsBudgetRemaining >= 0
            ? formatCurrency(result.overview.adsBudgetRemaining)
            : `${formatCurrency(Math.abs(result.overview.adsBudgetRemaining))} acima do teto`
        }
        detail={`Teto: ${formatCurrency(result.overview.availableAdsBudget)} (${scenario.config.tacosMaximoPct}% da meta de faturamento)`}
        tone={result.overview.adsBudgetRemaining >= 0 ? "info" : "danger"}
        tooltip={`Quanto ainda sobra para investir em anúncios sem estourar o TACOS de ${scenario.config.tacosMaximoPct}%, considerando sua meta de faturamento. Quando aparece "acima do teto", você já gastou mais em anúncios do que o planejado para chegar na meta.`}
      />
    </div>

    <Card
      title="Fluxo de Ads"
      description="Leitura do caminho entre investimento, entrega, conversão e receita. A Receita Ads vem do painel de Ads (janela de atribuição mais ampla), por isso costuma ser maior que a Dependência Ads da Visão geral, que usa atribuição direta."
    >
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
          <span className="funnel-label">Receita Ads (painel)</span>
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
