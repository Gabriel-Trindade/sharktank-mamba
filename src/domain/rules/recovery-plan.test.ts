import { describe, expect, it } from "vitest";
import { analyzeScenario } from "../analysis";
import { demoScenario } from "../../mocks/demoScenario";
import type { SellerScenario } from "../types";

describe("recovery plan", () => {
  it("prioritizes reactivating inactive listings (priority 1)", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      products: demoScenario.products.map((product, index) =>
        index === 0 ? { ...product, statusAnuncio: "Inativo" } : product,
      ),
    };
    const result = analyzeScenario(scenario);
    const action = result.recoveryPlan.find((item) => item.id === "reactivate-listings");

    expect(action).toBeDefined();
    expect(action?.priority).toBe(1);
  });

  it("recommends Shopee FULL when available and unused", () => {
    const result = analyzeScenario(demoScenario);

    expect(result.recoveryPlan.some((action) => action.id === "enable-shopee-full")).toBe(true);
  });

  it("recommends using promotion headroom when promotion is underused", () => {
    const result = analyzeScenario(demoScenario);

    expect(result.recoveryPlan.some((action) => action.id === "use-promotion-headroom")).toBe(true);
  });

  it("asks to confirm ads status when it is unknown (verify-ads-status)", () => {
    const scenario: SellerScenario = {
      ...demoScenario,
      products: demoScenario.products.map((product) => ({ ...product, adsStatus: undefined })),
    };
    const result = analyzeScenario(scenario);

    expect(result.recoveryPlan.some((item) => item.id === "verify-ads-status")).toBe(true);
  });

  it("quantifies the revenue gap to the target", () => {
    const result = analyzeScenario(demoScenario);
    const action = result.recoveryPlan.find((item) => item.id === "recover-sales-base");

    expect(result.overview.revenueGapToTarget).toBeCloseTo(20532.27, 2);
    expect(action?.evidence).toContain("Faltam");
    expect(action?.expectedImpact).toContain("por dia");
  });
});
