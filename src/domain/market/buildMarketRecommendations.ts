import { formatCurrency } from "../formatters";
import type { MarketBenchmarkFromGecko } from "./geckoTypes";

/**
 * Gera 2 a 4 frases interpretáveis para a apresentação, a partir do benchmark
 * de preço/sinais competitivos da GeckoAPI e do preço do seller.
 * Não é um motor de IA: são leituras simples.
 */
export const buildMarketRecommendations = (
  benchmark: MarketBenchmarkFromGecko,
  sellerPrice: number,
): string[] => {
  const recommendations: string[] = [];
  const marketPrice = benchmark.marketMedianPrice ?? benchmark.marketAveragePrice;

  if (marketPrice && marketPrice > 0 && sellerPrice > 0) {
    const gapPct = ((sellerPrice - marketPrice) / marketPrice) * 100;
    const rounded = Math.round(gapPct);

    if (gapPct > 50) {
      recommendations.push(
        `Preço do seller está ${rounded}% acima da mediana do mercado (${formatCurrency(marketPrice)}). Testar nova faixa de preço ou kits com valor percebido maior.`,
      );
    } else if (gapPct > 15) {
      recommendations.push(
        `Preço do seller está ${rounded}% acima do mercado (${formatCurrency(marketPrice)}). Avaliar ajuste de preço, frete ou bundle para defender a margem.`,
      );
    } else if (gapPct < -15) {
      recommendations.push(
        `Preço do seller está abaixo do mercado (${formatCurrency(marketPrice)}). Validar margem antes de escalar volume.`,
      );
    } else {
      recommendations.push(
        `Preço do seller está dentro da faixa competitiva do mercado (${formatCurrency(marketPrice)}). Buscar ganho em volume e conversão.`,
      );
    }
  }

  if (benchmark.freeShippingRate !== null && benchmark.freeShippingRate >= 50) {
    recommendations.push(
      `${Math.round(benchmark.freeShippingRate)}% dos concorrentes usam frete grátis. Avaliar impacto disso na conversão da oferta.`,
    );
  }

  if (benchmark.sponsoredRate !== null && benchmark.sponsoredRate >= 30) {
    recommendations.push(
      `Categoria com presença relevante de anúncios (${Math.round(benchmark.sponsoredRate)}% patrocinados). Considerar Ads nos produtos de curva A.`,
    );
  }

  if (benchmark.verifiedSellerRate !== null && benchmark.verifiedSellerRate >= 50) {
    recommendations.push(
      `${Math.round(benchmark.verifiedSellerRate)}% dos concorrentes são lojas oficiais/verificadas. Reforçar prova social (reviews, selos) para competir.`,
    );
  }

  return recommendations.slice(0, 4);
};
