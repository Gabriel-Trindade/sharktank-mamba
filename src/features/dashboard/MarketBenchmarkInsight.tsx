import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { buildMarketRecommendations } from "../../domain/market/buildMarketRecommendations";
import type { MarketBenchmarkFromGecko } from "../../domain/market/geckoTypes";
import { formatCurrency, formatInteger, formatPercent } from "../../domain/formatters";
import type { MarketAnalysis } from "../../domain/types";
import { CompetitorPreviewList } from "./CompetitorPreviewList";

type MarketBenchmarkInsightProps = {
  insight: MarketBenchmarkFromGecko;
  analysis: MarketAnalysis;
};

const formatRate = (value: number | null) => (value === null ? "n/d" : formatPercent(value));

export const MarketBenchmarkInsight = ({ insight, analysis }: MarketBenchmarkInsightProps) => {
  const marketPrice = insight.marketMedianPrice ?? insight.marketAveragePrice;
  const recommendations = buildMarketRecommendations(insight, analysis.precoMedioSeller);

  return (
    <Card
      title={`Leitura de mercado — ${analysis.categoria}`}
      description={`Resumo competitivo da busca "${insight.keyword}" na Shopee.`}
      actions={<Badge tone="info">Fonte: {insight.source}</Badge>}
    >
      <div className="section-stack">
        <div className="dashboard-grid">
          <MetricCard
            label="Preço mediano do mercado"
            value={marketPrice !== null ? formatCurrency(marketPrice) : "—"}
            detail={`${insight.itemsAnalyzed} produtos analisados`}
          />
          <MetricCard label="Preço médio do seller" value={formatCurrency(analysis.precoMedioSeller)} />
          <MetricCard
            label="Gap de preço"
            value={formatPercent(analysis.gapPct)}
            tone={analysis.highGap ? "danger" : "success"}
            detail={analysis.highGap ? "Muito acima do mercado" : "Dentro/próximo da faixa"}
          />
        </div>

        <div className="dashboard-grid">
          <MetricCard label="Frete grátis" value={formatRate(insight.freeShippingRate)} detail="dos concorrentes" />
          <MetricCard label="Patrocinados" value={formatRate(insight.sponsoredRate)} detail="anúncios na busca" />
          <MetricCard label="Vendedores verificados" value={formatRate(insight.verifiedSellerRate)} detail="oficial / verificado" />
          <MetricCard
            label="Avaliação média"
            value={insight.averageRating !== null ? insight.averageRating.toFixed(1) : "n/d"}
            detail={insight.averageReviewCount !== null ? `${formatInteger(insight.averageReviewCount)} reviews/produto` : undefined}
          />
        </div>

        {insight.topItems.length > 0 ? (
          <div className="gecko-block">
            <h4 className="gecko-block-title">Principais concorrentes</h4>
            <CompetitorPreviewList items={insight.topItems} />
          </div>
        ) : null}

        {recommendations.length > 0 ? (
          <div className="gecko-block">
            <h4 className="gecko-block-title">Recomendações</h4>
            <ul className="compact-list">
              {recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
