import type { AnalysisResult, SellerScenario } from "./types";
import { calculateOverview } from "./calculations/account";
import { analyzeMarket } from "./calculations/market";
import { analyzeProducts } from "./calculations/products";
import { generateInsights } from "./rules/insights";
import { generateRecoveryPlan } from "./rules/recovery-plan";

export const analyzeScenario = (scenario: SellerScenario): AnalysisResult => {
  const overview = calculateOverview(
    scenario.account,
    scenario.traffic,
    scenario.ads,
    scenario.config,
  );
  const market = analyzeMarket(scenario.market);
  const products = analyzeProducts(
    scenario.products,
    scenario.market,
    scenario.account,
    scenario.config,
  );
  const partialResult = { overview, products, market };

  return {
    ...partialResult,
    insights: generateInsights(scenario, partialResult),
    recoveryPlan: generateRecoveryPlan(scenario, partialResult),
  };
};
