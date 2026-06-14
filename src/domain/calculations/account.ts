import type { AccountMetrics, AdsMetrics, ScenarioConfig, TrafficMetrics } from "../types";
import { percentage, percentageDrop, percentageGrowth, safeDivide } from "./math";

export const calculateAverageTicket = (account: AccountMetrics) =>
  safeDivide(account.vendas30d, account.pedidos30d);

export const calculateVisitToBuyerConversion = (account: AccountMetrics) =>
  percentage(account.compradores, account.visitantes);

export const hasSalesDrop = (account: AccountMetrics) =>
  account.vendas30d < account.vendasPeriodoAnterior;

export const hasOrdersDrop = (account: AccountMetrics) =>
  account.pedidos30d < account.pedidosPeriodoAnterior;

export const hasHighCancellation = (account: AccountMetrics) =>
  safeDivide(account.cancelamentos30d, account.pedidos30d) >= 0.08;

export const hasLowConversion = (account: AccountMetrics) =>
  safeDivide(account.compradores, account.visitantes) < 0.05;

export const calculateOverview = (
  account: AccountMetrics,
  traffic: TrafficMetrics,
  ads: AdsMetrics,
  config: ScenarioConfig,
) => {
  const roas = ads.roas ?? safeDivide(ads.vendasAds, ads.investimentoAds);
  const ctr = ads.ctr ?? percentage(ads.cliques, ads.impressoes);
  const cpc = safeDivide(ads.investimentoAds, ads.cliques);
  const averageTicket = calculateAverageTicket(account);
  const revenueGapToTarget = Math.max(config.metaFaturamento - account.vendas30d, 0);
  const ordersNeededToTarget = averageTicket > 0 ? Math.ceil(revenueGapToTarget / averageTicket) : 0;
  const availableAdsBudget = config.metaFaturamento * (config.tacosMaximoPct / 100);

  return {
    salesDropPct: percentageDrop(account.vendas30d, account.vendasPeriodoAnterior),
    ordersDropPct: percentageDrop(account.pedidos30d, account.pedidosPeriodoAnterior),
    cancellationGrowthPct: percentageGrowth(
      account.cancelamentos30d,
      account.cancelamentosPeriodoAnterior,
    ),
    averageTicket,
    visitToBuyerConversion: calculateVisitToBuyerConversion(account),
    adDependencyPct: percentage(traffic.vendasShopeeAds, traffic.vendasTotais),
    roas,
    ctr,
    cpc,
    clickToOrderConversion: percentage(ads.pedidosAds, ads.cliques),
    tacosUsedPct: percentage(ads.investimentoAds, account.vendas30d || config.metaFaturamento),
    targetProgressPct: percentage(account.vendas30d, config.metaFaturamento),
    revenueGapToTarget,
    ordersNeededToTarget,
    dailyRevenueNeededToTarget: safeDivide(revenueGapToTarget, 30),
    dailyOrdersNeededToTarget: ordersNeededToTarget > 0 ? Math.ceil(safeDivide(ordersNeededToTarget, 30)) : 0,
    availableAdsBudget,
    adsBudgetRemaining: Math.max(availableAdsBudget - ads.investimentoAds, 0),
    contributionMarginValue: account.vendas30d * (config.margemContribuicaoPct / 100),
    sales30d: account.vendas30d,
    orders30d: account.pedidos30d,
    cancellations30d: account.cancelamentos30d,
    visitors: account.visitantes,
    buyers: account.compradores,
  };
};
