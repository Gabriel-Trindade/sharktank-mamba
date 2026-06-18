import type { MarketAnalysis, MarketBenchmark } from "../types";
import { percentage, round, safeDivide } from "./math";

export const calculateMarketGapRatio = (precoSeller: number, precoMercado: number) =>
  safeDivide(precoSeller, precoMercado);

export const calculateMarketGapPct = (precoSeller: number, precoMercado: number) =>
  percentage(precoSeller - precoMercado, precoMercado);

export const isHighMarketGap = (precoSeller: number, precoMercado: number) =>
  calculateMarketGapRatio(precoSeller, precoMercado) >= 2.5;

export const findMarketForCategory = (
  market: MarketBenchmark[],
  categoria: string,
) => {
  const normalizedCategory = categoria.trim().toLowerCase();
  return market.find((item) => item.categoria.trim().toLowerCase() === normalizedCategory);
};

export type SellerPriceBandPosition = "abaixo" | "dentro" | "acima" | null;

/**
 * Posiciona o preço do seller frente à faixa observada (min–max) do mercado.
 * Retorna `null` quando não há faixa válida (sem min/max, valores não finitos, ou min > max).
 */
export const evaluateSellerPriceBand = (item: MarketBenchmark): SellerPriceBandPosition => {
  const { precoMinMercado, precoMaxMercado, precoMedioSeller } = item;

  if (
    precoMinMercado === undefined ||
    precoMaxMercado === undefined ||
    !Number.isFinite(precoMinMercado) ||
    !Number.isFinite(precoMaxMercado) ||
    precoMinMercado > precoMaxMercado ||
    precoMedioSeller <= 0
  ) {
    return null;
  }

  if (precoMedioSeller > precoMaxMercado) {
    return "acima";
  }

  if (precoMedioSeller < precoMinMercado) {
    return "abaixo";
  }

  return "dentro";
};

export const analyzeMarket = (market: MarketBenchmark[]): MarketAnalysis[] =>
  market.map((item) => {
    const gapRatio = calculateMarketGapRatio(item.precoMedioSeller, item.precoMedioMercado);
    const gapPct = calculateMarketGapPct(item.precoMedioSeller, item.precoMedioMercado);
    const highGap = gapRatio >= 2.5;
    const sellerPriceVsBand = evaluateSellerPriceBand(item);

    return {
      categoria: item.categoria,
      palavraChave: item.palavraChave,
      precoMedioMercado: item.precoMedioMercado,
      precoMedioSeller: item.precoMedioSeller,
      precoMinMercado: item.precoMinMercado,
      precoMaxMercado: item.precoMaxMercado,
      sellerPriceVsBand,
      gapRatio: round(gapRatio, 2),
      gapPct: round(gapPct, 2),
      highGap,
      reading: buildMarketReading(highGap, sellerPriceVsBand),
    };
  });

const buildMarketReading = (highGap: boolean, sellerPriceVsBand: SellerPriceBandPosition) => {
  if (sellerPriceVsBand === "acima") {
    return "Preço do seller acima do teto observado no mercado; justificar valor premium ou rever posicionamento.";
  }

  if (highGap) {
    return "Preço do seller muito acima do mercado; validar mix, frete e promoção.";
  }

  if (sellerPriceVsBand === "abaixo") {
    return "Preço do seller abaixo do piso do mercado; validar margem antes de escalar volume.";
  }

  return "Preço comparável ao mercado; buscar ganho em conversão e oferta.";
};
