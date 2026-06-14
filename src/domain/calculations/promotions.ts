import type { PromotionMetrics, ScenarioConfig } from "../types";
import { percentage, safeDivide } from "./math";

export const calculatePromotionHeadroomPct = (
  promotion: PromotionMetrics,
  config?: ScenarioConfig,
) => {
  const maxDiscount = config?.descontoMaximoPct ?? promotion.descontoMaximoPct;
  const currentDiscount = config?.descontoAtualPct ?? promotion.descontoAtualPct;

  return Math.max(maxDiscount - currentDiscount, 0);
};

export const calculatePromotionSharePct = (promotion: PromotionMetrics, sales30d: number) =>
  percentage(promotion.vendasPromocao, sales30d);

export const calculatePromotionTicket = (promotion: PromotionMetrics) =>
  safeDivide(promotion.vendasPromocao, promotion.pedidosPromocao);

export const isPromotionUnderused = (
  promotion: PromotionMetrics,
  config?: ScenarioConfig,
) => {
  const maxDiscount = config?.descontoMaximoPct ?? promotion.descontoMaximoPct;
  const currentDiscount = config?.descontoAtualPct ?? promotion.descontoAtualPct;

  return maxDiscount > 0 && currentDiscount < maxDiscount * 0.7;
};
