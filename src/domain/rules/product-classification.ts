import type { MarketBenchmark, ProductClassification, ProductRow, ScenarioConfig } from "../types";
import { findMarketForCategory } from "../calculations/market";
import { safeDivide } from "../calculations/math";

export type ProductClassificationContext = {
  products: ProductRow[];
  market: MarketBenchmark[];
  averageTicket: number;
  config: ScenarioConfig;
};

export const classifyProduct = (
  product: ProductRow,
  context: ProductClassificationContext,
): ProductClassification[] => {
  const classifications: ProductClassification[] = [];
  const medianPrice = median(context.products.map((item) => item.precoVenda));
  const medianGmv = median(context.products.map((item) => item.gmv30d));
  const medianUnits = median(context.products.map((item) => item.unidadesVendidas30d));
  const marginPct = safeDivide(product.precoVenda - product.custo, product.precoVenda) * 100;
  const isChampion = isRotationChampion(product, context.products);
  const market = findMarketForCategory(context.market, product.categoria);
  const marketGapRatio = market ? safeDivide(product.precoVenda, market.precoMedioMercado) : 1;
  const hasStock = product.estoque === undefined || product.estoque > 0;
  const isLuckySale = product.unidadesVendidas30d <= 1 && (product.gmv30d >= medianGmv || product.precoVenda > medianPrice);
  const hasHighMarketGap = marketGapRatio >= 2.5;
  const hasPromotionHeadroom = context.config.descontoMaximoPct > context.config.descontoAtualPct;

  if (isChampion) {
    classifications.push("campeao_de_giro");
  }

  if (isLuckySale) {
    classifications.push("venda_por_sorte");
  }

  if (isChampion && marginPct > 0 && product.adsStatus !== "ativo" && hasStock && !hasHighMarketGap && !isLuckySale) {
    classifications.push("prioridade_ads");
  }

  if (
    !hasStock ||
    hasHighMarketGap ||
    isLuckySale ||
    (product.unidadesVendidas30d <= medianUnits && product.precoVenda > medianPrice && product.adsStatus !== "ativo")
  ) {
    classifications.push("nao_priorizar_cpc");
  }

  if (
    hasPromotionHeadroom &&
    marginPct >= context.config.descontoMaximoPct &&
    product.unidadesVendidas30d <= medianUnits &&
    marketGapRatio > 1.15
  ) {
    classifications.push("candidato_promocao");
  }

  if (product.precoVenda < context.averageTicket && marginPct > 0 && product.unidadesVendidas30d >= medianUnits) {
    classifications.push("produto_isca");
  }

  return classifications;
};

export const isRotationChampion = (product: ProductRow, products: ProductRow[]) => {
  if (product.unidadesVendidas30d >= 10) {
    return true;
  }

  const sorted = [...products].sort((a, b) => b.unidadesVendidas30d - a.unidadesVendidas30d);
  const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));

  return sorted.slice(0, topCount).some((item) => item.sku === product.sku);
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
