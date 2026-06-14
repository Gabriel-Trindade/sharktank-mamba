import type { MarketBenchmark, ProductRow, ScoreBand } from "../types";
import { findMarketForCategory } from "./market";
import { clamp, safeDivide } from "./math";

export type ScoreContext = {
  products: ProductRow[];
  market: MarketBenchmark[];
};

export const scoreBand = (score: number): ScoreBand => {
  if (score >= 85) {
    return "prioridade_maxima";
  }

  if (score >= 70) {
    return "boa_oportunidade";
  }

  if (score >= 40) {
    return "observar_otimizar";
  }

  return "baixa_prioridade";
};

export const calculateOpportunityScore = (product: ProductRow, context: ScoreContext) => {
  const maxUnits = Math.max(...context.products.map((item) => item.unidadesVendidas30d), 0);
  const maxGmv = Math.max(...context.products.map((item) => item.gmv30d), 0);
  const marginPct = safeDivide(product.precoVenda - product.custo, product.precoVenda) * 100;
  const market = findMarketForCategory(context.market, product.categoria);
  const marketRatio = market ? safeDivide(product.precoVenda, market.precoMedioMercado) : 1;
  const medianPrice = median(context.products.map((item) => item.precoVenda));
  const medianGmv = median(context.products.map((item) => item.gmv30d));
  const isLuckySale =
    product.unidadesVendidas30d <= 1 && (product.gmv30d >= medianGmv || product.precoVenda > medianPrice);
  const hasNoMargin = marginPct <= 0;
  const hasHighMarketGap = marketRatio >= 2.5;
  const hasNoStock = product.estoque === 0;

  const giroScore = clamp(safeDivide(product.unidadesVendidas30d, maxUnits) * 100);
  const margemScore = clamp(safeDivide(marginPct, 40) * 100);
  const gmvScore = clamp(safeDivide(product.gmv30d, maxGmv) * 100);
  const adsOpportunityScore =
    hasNoStock ? 25 : product.adsStatus === "ativo" ? 45 : product.unidadesVendidas30d >= 3 && marginPct > 0 ? 100 : 55;
  const marketFitScore = marketRatio <= 0 ? 60 : marketRatio <= 1.1 ? 100 : marketRatio <= 1.6 ? 75 : marketRatio <= 2.5 ? 45 : 10;
  const riskPenalty =
    (isLuckySale ? 25 : 0) +
    (hasNoMargin ? 30 : 0) +
    (hasHighMarketGap ? 25 : 0) +
    (hasNoStock ? 40 : 0);

  return Math.round(
    clamp(
      giroScore * 0.35 +
        margemScore * 0.2 +
        gmvScore * 0.2 +
        adsOpportunityScore * 0.15 +
        marketFitScore * 0.1 -
        riskPenalty,
    ),
  );
};

const median = (values: number[]) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);

  if (sorted.length === 0) {
    return 0;
  }

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};
