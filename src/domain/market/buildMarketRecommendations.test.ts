import { describe, expect, it } from "vitest";
import { buildMarketRecommendations } from "./buildMarketRecommendations";
import type { MarketBenchmarkFromGecko } from "./geckoTypes";

const baseBenchmark = (overrides: Partial<MarketBenchmarkFromGecko> = {}): MarketBenchmarkFromGecko => ({
  source: "GeckoAPI / Shopee PLP",
  keyword: "semi-joias",
  itemsAnalyzed: 10,
  marketAveragePrice: 22,
  marketMedianPrice: 22,
  marketMinPrice: 17,
  marketMaxPrice: 33,
  marketTotalSoldCount: 10000,
  marketAverageSoldCount: 1000,
  freeShippingRate: 20,
  sponsoredRate: 10,
  verifiedSellerRate: 40,
  averageRating: 4.7,
  averageReviewCount: 1500,
  topItems: [],
  ...overrides,
});

describe("buildMarketRecommendations", () => {
  it("aponta preço muito acima quando o gap passa de 50%", () => {
    const recs = buildMarketRecommendations(baseBenchmark(), 132.5);
    expect(recs[0]).toMatch(/acima/i);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs.length).toBeLessThanOrEqual(4);
  });

  it("reconhece preço dentro da faixa competitiva", () => {
    const recs = buildMarketRecommendations(baseBenchmark(), 23);
    expect(recs[0]).toMatch(/faixa competitiva/i);
  });

  it("alerta sobre preço abaixo do mercado", () => {
    const recs = buildMarketRecommendations(baseBenchmark(), 15);
    expect(recs[0]).toMatch(/abaixo do mercado/i);
  });

  it("adiciona sinal de frete grátis quando taxa alta", () => {
    const recs = buildMarketRecommendations(baseBenchmark({ freeShippingRate: 80 }), 23);
    expect(recs.some((r) => /frete grátis/i.test(r))).toBe(true);
  });

  it("adiciona sinal de vendedores verificados quando taxa alta", () => {
    const recs = buildMarketRecommendations(baseBenchmark({ verifiedSellerRate: 70 }), 23);
    expect(recs.some((r) => /verificad/i.test(r))).toBe(true);
  });

  it("nunca passa de 4 recomendações", () => {
    const recs = buildMarketRecommendations(
      baseBenchmark({ freeShippingRate: 90, sponsoredRate: 60, verifiedSellerRate: 80 }),
      200,
    );
    expect(recs.length).toBeLessThanOrEqual(4);
  });
});
