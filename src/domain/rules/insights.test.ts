import { describe, expect, it } from "vitest";
import { analyzeScenario } from "../analysis";
import { demoScenario } from "../../mocks/demoScenario";
import type { SellerScenario } from "../types";

const insightIds = (scenario: SellerScenario) =>
  analyzeScenario(scenario).insights.map((insight) => insight.id);

describe("data consistency insights for previously-unused inputs", () => {
  it("does not flag the consistent demo scenario", () => {
    const ids = insightIds(demoScenario);

    expect(ids).not.toContain("ads-items-invalid");
    expect(ids).not.toContain("promotion-units-invalid");
    expect(ids).not.toContain("promotion-buyers-invalid");
    expect(ids).not.toContain("inactive-listings");
    expect(ids).not.toContain("net-sales-above-gross");
  });

  it("flags inactive listings", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      products: demoScenario.products.map((product, index) =>
        index === 0 ? { ...product, statusAnuncio: "pausado" } : product,
      ),
    };

    expect(insightIds(scenario)).toContain("inactive-listings");
  });

  it("flags net sales (sem desconto) above gross", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      account: { ...demoScenario.account, vendasSemDesconto: demoScenario.account.vendas30d + 100 },
    };

    expect(insightIds(scenario)).toContain("net-sales-above-gross");
  });

  it("flags Ads items below orders (itensVendidosAds < pedidosAds)", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      ads: { ...demoScenario.ads, pedidosAds: 79, itensVendidosAds: 40 },
    };

    expect(insightIds(scenario)).toContain("ads-items-invalid");
  });

  it("flags promotion units below orders", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      promotion: { ...demoScenario.promotion, pedidosPromocao: 25, unidadesVendidasPromocao: 10 },
    };

    expect(insightIds(scenario)).toContain("promotion-units-invalid");
  });

  it("flags promotion buyers above orders", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      promotion: { ...demoScenario.promotion, pedidosPromocao: 25, compradoresPromocao: 40 },
    };

    expect(insightIds(scenario)).toContain("promotion-buyers-invalid");
  });
});

describe("ads recommendations under unknown status (modo verificar)", () => {
  it("asks to verify ads (not 'pronto para teste') when status is unknown", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      products: demoScenario.products.map((product) => ({ ...product, adsStatus: undefined })),
    };
    const ids = insightIds(scenario);

    expect(ids).toContain("verify-ads-products");
    expect(ids).not.toContain("ads-priority-products");
  });

  it("keeps confident ads-priority when status is explicitly inactive (demo)", () => {
    const ids = insightIds(demoScenario);

    expect(ids).toContain("ads-priority-products");
    expect(ids).not.toContain("verify-ads-products");
  });
});
