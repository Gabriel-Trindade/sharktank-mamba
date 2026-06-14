import { describe, expect, it } from "vitest";
import { calculateAdDependency, calculateClickToOrderConversion, calculateCpc, calculateCtr, calculateRoas } from "./ads";
import { calculateOverview, hasHighCancellation, hasLowConversion, hasOrdersDrop, hasSalesDrop } from "./account";
import { analyzeMarket, calculateMarketGapRatio, isHighMarketGap } from "./market";
import { analyzeProducts } from "./products";
import type { AccountMetrics, AdsMetrics, ProductRow, ScenarioConfig, TrafficMetrics } from "../types";

const account: AccountMetrics = {
  vendas30d: 800,
  vendasPeriodoAnterior: 1000,
  pedidos30d: 80,
  pedidosPeriodoAnterior: 100,
  cancelamentos30d: 8,
  cancelamentosPeriodoAnterior: 2,
  visitantes: 2000,
  compradores: 80,
};

const traffic: TrafficMetrics = {
  vendasTotais: 1000,
  vendasCardProduto: 200,
  vendasLives: 0,
  vendasVideoVendedor: 100,
  vendasAfiliado: 20,
  vendasShopeeAds: 650,
};

const ads: AdsMetrics = {
  impressoes: 10000,
  cliques: 500,
  pedidosAds: 25,
  itensVendidosAds: 32,
  vendasAds: 2000,
  investimentoAds: 500,
};

const config: ScenarioConfig = {
  metaFaturamento: 1200,
  margemContribuicaoPct: 30,
  tacosMaximoPct: 12,
  descontoMaximoPct: 15,
  descontoAtualPct: 5,
  shopeeFullLiberado: true,
  shopeeFullEmUso: false,
};

describe("ads calculations", () => {
  it("calculates ROAS, CTR, CPC, dependency and click conversion", () => {
    expect(calculateRoas(ads)).toBe(4);
    expect(calculateCtr(ads)).toBe(5);
    expect(calculateCpc(ads)).toBe(1);
    expect(calculateClickToOrderConversion(ads)).toBe(5);
    expect(calculateAdDependency(traffic)).toBe(65);
  });

  it("returns neutral values for zero division", () => {
    expect(calculateRoas({ ...ads, investimentoAds: 0 })).toBe(0);
    expect(calculateCtr({ ...ads, impressoes: 0 })).toBe(0);
    expect(calculateCpc({ ...ads, cliques: 0 })).toBe(0);
  });
});

describe("market calculations", () => {
  it("calculates market gap and avoids zero division", () => {
    expect(calculateMarketGapRatio(250, 100)).toBe(2.5);
    expect(isHighMarketGap(250, 100)).toBe(true);
    expect(calculateMarketGapRatio(250, 0)).toBe(0);
  });
});

describe("account calculations", () => {
  it("detects sales drop, order drop, high cancellation and low conversion", () => {
    expect(hasSalesDrop(account)).toBe(true);
    expect(hasOrdersDrop(account)).toBe(true);
    expect(hasHighCancellation(account)).toBe(true);
    expect(hasLowConversion(account)).toBe(true);
  });

  it("builds overview without NaN", () => {
    const overview = calculateOverview(account, traffic, ads, config);
    expect(overview.salesDropPct).toBe(20);
    expect(overview.ordersDropPct).toBe(20);
    expect(overview.averageTicket).toBe(10);
    expect(overview.revenueGapToTarget).toBe(400);
    expect(overview.ordersNeededToTarget).toBe(40);
    expect(overview.availableAdsBudget).toBe(144);
    expect(overview.adsBudgetRemaining).toBe(0);
    expect(Object.values(overview).every(Number.isFinite)).toBe(true);
  });
});

describe("product and market analysis", () => {
  const products: ProductRow[] = [
    {
      sku: "A",
      produto: "Campeão GMV e giro",
      categoria: "Joias",
      custo: 40,
      precoVenda: 100,
      unidadesVendidas30d: 50,
      gmv30d: 5000,
      estoque: 10,
      adsStatus: "ativo",
    },
    {
      sku: "B",
      produto: "Ticket alto pontual",
      categoria: "Joias",
      custo: 100,
      precoVenda: 1000,
      unidadesVendidas30d: 1,
      gmv30d: 1000,
      estoque: 4,
      adsStatus: "inativo",
    },
    {
      sku: "C",
      produto: "Giro médio",
      categoria: "Joias",
      custo: 20,
      precoVenda: 50,
      unidadesVendidas30d: 30,
      gmv30d: 1500,
      estoque: 30,
      adsStatus: "inativo",
    },
    {
      sku: "D",
      produto: "Giro com GMV baixo",
      categoria: "Joias",
      custo: 15,
      precoVenda: 50,
      unidadesVendidas30d: 20,
      gmv30d: 1000,
      estoque: 30,
      adsStatus: "inativo",
    },
  ];

  it("marks Curve A by GMV and by real rotation separately", () => {
    const result = analyzeProducts(products, [{ categoria: "Joias", precoMedioMercado: 90, precoMedioSeller: 100 }], account, config);

    expect(result.find((product) => product.sku === "B")?.isCurveAGmv).toBe(true);
    expect(result.find((product) => product.sku === "B")?.isCurveAUnits).toBe(false);
    expect(result.find((product) => product.sku === "D")?.isCurveAGmv).toBe(false);
    expect(result.find((product) => product.sku === "D")?.isCurveAUnits).toBe(true);
  });

  it("detects low market liquidity from unit share", () => {
    const [market] = analyzeMarket([
      {
        categoria: "Joias",
        precoMedioMercado: 60,
        precoMedioSeller: 160,
        unidadesMesMercado: 1000,
        unidadesMesSeller: 50,
      },
    ]);

    expect(market.highGap).toBe(true);
    expect(market.lowLiquidity).toBe(true);
    expect(market.unitSharePct).toBe(5);
  });
});
