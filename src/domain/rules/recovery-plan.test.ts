import { describe, expect, it } from "vitest";
import { analyzeScenario } from "../analysis";
import { demoScenario } from "../../mocks/demoScenario";

describe("recovery plan", () => {
  it("recommends Shopee FULL when available and unused", () => {
    const result = analyzeScenario(demoScenario);

    expect(result.recoveryPlan.some((action) => action.id === "enable-shopee-full")).toBe(true);
  });

  it("recommends using promotion headroom when promotion is underused", () => {
    const result = analyzeScenario(demoScenario);

    expect(result.recoveryPlan.some((action) => action.id === "use-promotion-headroom")).toBe(true);
  });

  it("quantifies the revenue gap to the target", () => {
    const result = analyzeScenario(demoScenario);
    const action = result.recoveryPlan.find((item) => item.id === "recover-sales-base");

    expect(result.overview.revenueGapToTarget).toBeCloseTo(20532.27, 2);
    expect(action?.evidence).toContain("Faltam");
    expect(action?.expectedImpact).toContain("por dia");
  });
});
