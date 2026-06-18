import { describe, expect, it } from "vitest";
import { calculateAdDependency, calculateClickToOrderConversion, calculateCpc, calculateCtr, calculateRoas } from "./ads";
import { calculateOverview, hasHighCancellation, hasLowConversion, hasOrdersDrop, hasSalesDrop } from "./account";
import { analyzeMarket, calculateMarketGapRatio, isHighMarketGap } from "./market";
import { analyzeProducts } from "./products";
import { calculateOpportunityScore } from "./score";
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
    // 144 de teto − 500 investidos = −356 (estourou o teto). A asserção anterior dizia 0.
    expect(overview.adsBudgetRemaining).toBe(-356);
    // Pedidos/dia derivam do ritmo de receita/dia (13,33) sobre o ticket (10) → ~1, não ceil(40/30)=2.
    expect(overview.dailyRevenueNeededToTarget).toBeCloseTo(13.33, 2);
    expect(overview.dailyOrdersNeededToTarget).toBe(1);
    expect(Object.values(overview).every(Number.isFinite)).toBe(true);
  });

  it("keeps R$/dia e pedidos/dia coerentes (mesma base de ritmo)", () => {
    // Caso real do cenário demo: meta 30k, vendas 9.467,73 em 85 pedidos.
    const pacingAccount: AccountMetrics = { ...account, vendas30d: 9467.73, pedidos30d: 85 };
    const pacingConfig: ScenarioConfig = { ...config, metaFaturamento: 30000 };
    const overview = calculateOverview(pacingAccount, traffic, ads, pacingConfig);

    const ticket = 9467.73 / 85;
    expect(overview.ordersNeededToTarget).toBe(185); // total para fechar o gap
    expect(overview.dailyRevenueNeededToTarget).toBeCloseTo(684.41, 2);
    // Antes: Math.ceil(185 / 30) = 7, divergindo do ritmo exibido (≈6,1 pedidos/dia).
    expect(overview.dailyOrdersNeededToTarget).toBe(6);
    // Coerência: pedidos/dia ≈ (receita/dia ÷ ticket), dentro de 1 pedido de arredondamento.
    expect(
      Math.abs(overview.dailyOrdersNeededToTarget - overview.dailyRevenueNeededToTarget / ticket),
    ).toBeLessThan(1);
  });

  it("usa base única (vendas reais) para o TACOS realizado, sem cair para a meta", () => {
    const tacosAccount: AccountMetrics = { ...account, vendas30d: 9467.73 };
    const tacosAds: AdsMetrics = { ...ads, investimentoAds: 1572 };
    const tacosConfig: ScenarioConfig = { ...config, metaFaturamento: 30000 };
    const overview = calculateOverview(tacosAccount, traffic, tacosAds, tacosConfig);

    // Base = vendas reais: 1572 / 9467,73 ≈ 16,6%.
    expect(overview.tacosUsedPct).toBeCloseTo((1572 / 9467.73) * 100, 4);
    // E NÃO a meta: 1572 / 30000 = 5,24% seria a base errada.
    expect(overview.tacosUsedPct).not.toBeCloseTo((1572 / 30000) * 100, 4);
  });

  it("não troca silenciosamente o TACOS para a meta quando não há vendas", () => {
    const noSalesAccount: AccountMetrics = { ...account, vendas30d: 0 };
    const overview = calculateOverview(noSalesAccount, traffic, { ...ads, investimentoAds: 500 }, config);

    // Sem vendas, o TACOS realizado é indefinido → 0 (e não 500/meta como na versão anterior).
    expect(overview.tacosUsedPct).toBe(0);
  });

  it("mede o desconto da Shopee como bruto menos vendas sem desconto", () => {
    const discountAccount: AccountMetrics = { ...account, vendas30d: 1000, vendasSemDesconto: 900 };
    const overview = calculateOverview(discountAccount, traffic, ads, config);

    expect(overview.shopeeDiscountValue).toBe(100);
    expect(overview.shopeeDiscountSharePct).toBeCloseTo(10, 4);
  });

  it("nunca reporta desconto Shopee negativo quando o sem-desconto supera o bruto", () => {
    const inconsistentAccount: AccountMetrics = { ...account, vendas30d: 1000, vendasSemDesconto: 1100 };
    const overview = calculateOverview(inconsistentAccount, traffic, ads, config);

    expect(overview.shopeeDiscountValue).toBe(0);
    expect(overview.shopeeDiscountSharePct).toBe(0);
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

  it("flags high price gap from market benchmark", () => {
    const [market] = analyzeMarket([
      {
        categoria: "Joias",
        precoMedioMercado: 60,
        precoMedioSeller: 160,
      },
    ]);

    expect(market.highGap).toBe(true);
    expect(market.gapRatio).toBe(2.67);
    expect(market.reading).toMatch(/acima do mercado/i);
  });

  it("inclui o item que cruza 80% mas exclui a cauda e produtos sem contribuição", () => {
    const base = { categoria: "Joias", custo: 10, precoVenda: 100, estoque: 5 } as const;
    const curveProducts: ProductRow[] = [
      { ...base, sku: "P1", produto: "Top", unidadesVendidas30d: 50, gmv30d: 5000 },
      { ...base, sku: "P2", produto: "Segundo", unidadesVendidas30d: 25, gmv30d: 2500 },
      { ...base, sku: "P3", produto: "Cruza 80%", unidadesVendidas30d: 20, gmv30d: 2000 },
      { ...base, sku: "P4", produto: "Cauda", unidadesVendidas30d: 5, gmv30d: 500 },
      { ...base, sku: "P5", produto: "Sem giro", unidadesVendidas30d: 0, gmv30d: 0 },
    ];
    const result = analyzeProducts(curveProducts, [], account, config);
    const byId = (sku: string) => result.find((product) => product.sku === sku);

    // GMV acumulado: 5000+2500 = 75% (< 80%), então P3 entra ao cruzar para 95%; P4 (cauda) fica fora.
    expect(byId("P1")?.isCurveAGmv).toBe(true);
    expect(byId("P2")?.isCurveAGmv).toBe(true);
    expect(byId("P3")?.isCurveAGmv).toBe(true);
    expect(byId("P4")?.isCurveAGmv).toBe(false);
    // Produto sem contribuição (0 giro / 0 GMV) nunca é Curva A.
    expect(byId("P5")?.isCurveAGmv).toBe(false);
    expect(byId("P5")?.isCurveAUnits).toBe(false);
  });
});

describe("market price band (min–max)", () => {
  it("posiciona o preço do seller frente à faixa observada do mercado", () => {
    const [acima, abaixo, dentro, semFaixa] = analyzeMarket([
      { categoria: "Acima", precoMedioMercado: 100, precoMinMercado: 50, precoMaxMercado: 150, precoMedioSeller: 200 },
      { categoria: "Abaixo", precoMedioMercado: 100, precoMinMercado: 50, precoMaxMercado: 150, precoMedioSeller: 30 },
      { categoria: "Dentro", precoMedioMercado: 100, precoMinMercado: 50, precoMaxMercado: 150, precoMedioSeller: 120 },
      { categoria: "SemFaixa", precoMedioMercado: 100, precoMedioSeller: 120 },
    ]);

    expect(acima.sellerPriceVsBand).toBe("acima");
    expect(acima.reading).toMatch(/teto observado/i);
    expect(abaixo.sellerPriceVsBand).toBe("abaixo");
    expect(abaixo.reading).toMatch(/piso/i);
    expect(dentro.sellerPriceVsBand).toBe("dentro");
    expect(semFaixa.sellerPriceVsBand).toBeNull();
  });

  it("ignora faixa inválida (min > max)", () => {
    const [row] = analyzeMarket([
      { categoria: "Invalida", precoMedioMercado: 100, precoMinMercado: 150, precoMaxMercado: 50, precoMedioSeller: 80 },
    ]);

    expect(row.sellerPriceVsBand).toBeNull();
  });
});

describe("ads opportunity score with unknown status", () => {
  const championBase: ProductRow = {
    sku: "X",
    produto: "Campeão",
    categoria: "Cat",
    custo: 40,
    precoVenda: 100,
    unidadesVendidas30d: 20,
    gmv30d: 2000,
    estoque: 10,
  };

  it("does not reward a missing ads status as if it were a proven inactive opportunity", () => {
    const inactive = calculateOpportunityScore(
      { ...championBase, adsStatus: "inativo" },
      { products: [championBase], market: [] },
    );
    const unknown = calculateOpportunityScore(
      { ...championBase, adsStatus: "desconhecido" },
      { products: [championBase], market: [] },
    );

    // Inativo comprovado vale mais que desconhecido (que fica neutro).
    expect(inactive).toBeGreaterThan(unknown);
  });
});
