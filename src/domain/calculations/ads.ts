import type { AdsMetrics, TrafficMetrics } from "../types";
import { percentage, safeDivide } from "./math";

export const calculateCtr = (ads: AdsMetrics) => ads.ctr ?? percentage(ads.cliques, ads.impressoes);

export const calculateRoas = (ads: AdsMetrics) =>
  ads.roas ?? safeDivide(ads.vendasAds, ads.investimentoAds);

export const calculateCpc = (ads: AdsMetrics) => safeDivide(ads.investimentoAds, ads.cliques);

export const calculateClickToOrderConversion = (ads: AdsMetrics) =>
  percentage(ads.pedidosAds, ads.cliques);

export const calculateAdDependency = (traffic: TrafficMetrics) =>
  percentage(traffic.vendasShopeeAds, traffic.vendasTotais);

export const hasHighAdDependency = (traffic: TrafficMetrics) =>
  safeDivide(traffic.vendasShopeeAds, traffic.vendasTotais) >= 0.6;

export const hasWeakOrganicSupport = (traffic: TrafficMetrics) => {
  const affiliateShare = safeDivide(traffic.vendasAfiliado, traffic.vendasTotais);

  return traffic.vendasLives === 0 || traffic.vendasVideoVendedor === 0 || affiliateShare < 0.05;
};
