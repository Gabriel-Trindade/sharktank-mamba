import type { MarketBenchmark, ProductClassification, ProductRow, ScenarioConfig } from "../types";
import { findMarketForCategory } from "../calculations/market";
import { safeDivide } from "../calculations/math";

export type ProductClassificationContext = {
  products: ProductRow[];
  market: MarketBenchmark[];
  averageTicket: number;
  config: ScenarioConfig;
};

// statusAnuncio é o estado do ANÚNCIO (listing) na vitrine — diferente de adsStatus (campanha paga).
// Um anúncio pausado/inativo não vende nem organicamente nem com Ads, então tratamos com prioridade.
// Conservador por padrão: só consideramos inativo quando o texto diz claramente que está.
const PAUSED_LISTING_PATTERN =
  /(pausad|inativ|bloquead|suspens|exclu[ií]|deletad|removid|reprovad|violaç|indispon|encerrad|desativ)/i;

export const isAnuncioInativo = (statusAnuncio?: string): boolean => {
  if (!statusAnuncio) {
    return false;
  }

  return PAUSED_LISTING_PATTERN.test(statusAnuncio.trim());
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
  const anuncioInativo = isAnuncioInativo(product.statusAnuncio);

  // Anúncio pausado/inativo é o bloqueio número 1: vem primeiro para aparecer no badge do produto.
  if (anuncioInativo) {
    classifications.push("anuncio_inativo");
  }

  if (isChampion) {
    classifications.push("campeao_de_giro");
  }

  if (isLuckySale) {
    classifications.push("venda_por_sorte");
  }

  // Candidato a Ads: campeão de giro com margem, estoque, sem ser venda por sorte nem anúncio pausado.
  // Só AFIRMAMOS "ative" quando o Ads é sabidamente inativo. Quando o status é desconhecido (sem a
  // coluna na planilha), não inventamos — marcamos "verificar" para o seller confirmar no painel de Ads.
  const isAdsCandidate = isChampion && marginPct > 0 && hasStock && !isLuckySale && !anuncioInativo;
  const adsKnownInactive = product.adsStatus === "inativo";
  const adsUnknown = product.adsStatus === undefined || product.adsStatus === "desconhecido";

  if (isAdsCandidate && adsKnownInactive) {
    classifications.push("prioridade_ads");
  } else if (isAdsCandidate && adsUnknown) {
    classifications.push("verificar_ads");
  }

  // Gap alto sozinho não é suficiente para bloquear CPC — campeões de giro já provaram demanda ao preço premium.
  // Só bloquear quando gap alto se combina com baixo giro (produto não comprovado no mercado).
  if (
    !hasStock ||
    isLuckySale ||
    (hasHighMarketGap && product.unidadesVendidas30d <= medianUnits) ||
    (!hasHighMarketGap && product.unidadesVendidas30d <= medianUnits && product.precoVenda > medianPrice && product.adsStatus !== "ativo")
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
