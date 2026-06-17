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

export const analyzeMarket = (market: MarketBenchmark[]): MarketAnalysis[] =>
  market.map((item) => {
    const gapRatio = calculateMarketGapRatio(item.precoMedioSeller, item.precoMedioMercado);
    const gapPct = calculateMarketGapPct(item.precoMedioSeller, item.precoMedioMercado);
    const highGap = gapRatio >= 2.5;

    return {
      categoria: item.categoria,
      palavraChave: item.palavraChave,
      precoMedioMercado: item.precoMedioMercado,
      precoMedioSeller: item.precoMedioSeller,
      gapRatio: round(gapRatio, 2),
      gapPct: round(gapPct, 2),
      highGap,
      reading: buildMarketReading(highGap),
    };
  });

const buildMarketReading = (highGap: boolean) => {
  if (highGap) {
    return "Preço do seller muito acima do mercado; validar mix, frete e promoção.";
  }

  return "Preço comparável ao mercado; buscar ganho em conversão e oferta.";
};
