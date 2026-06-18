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
  // vendas30d é o faturamento BRUTO; vendasSemDesconto exclui os descontos subsidiados pela Shopee.
  // A diferença é o valor desses descontos, e a participação mostra quanto do bruto depende deles.
  const netOfShopeeDiscount = account.vendasSemDesconto ?? account.vendas30d;
  const shopeeDiscountValue = Math.max(account.vendas30d - netOfShopeeDiscount, 0);
  const shopeeDiscountSharePct = percentage(shopeeDiscountValue, account.vendas30d);
  const revenueGapToTarget = Math.max(config.metaFaturamento - account.vendas30d, 0);
  const ordersNeededToTarget = averageTicket > 0 ? Math.ceil(revenueGapToTarget / averageTicket) : 0;
  const dailyRevenueNeededToTarget = safeDivide(revenueGapToTarget, 30);
  // Pedidos/dia derivam do MESMO ritmo de receita/dia e do ticket — assim "R$/dia" e
  // "pedidos/dia" exibidos lado a lado contam a mesma história (são uma taxa média, por isso
  // arredondam em vez de usar Math.ceil sobre o total do período).
  const dailyOrdersNeededToTarget =
    averageTicket > 0 ? Math.round(safeDivide(dailyRevenueNeededToTarget, averageTicket)) : 0;
  const availableAdsBudget = config.metaFaturamento * (config.tacosMaximoPct / 100);

  return {
    salesDropPct: percentageDrop(account.vendas30d, account.vendasPeriodoAnterior),
    salesGrowthPct: percentageGrowth(account.vendas30d, account.vendasPeriodoAnterior),
    ordersDropPct: percentageDrop(account.pedidos30d, account.pedidosPeriodoAnterior),
    cancellationGrowthPct: percentageGrowth(
      account.cancelamentos30d,
      account.cancelamentosPeriodoAnterior,
    ),
    averageTicket,
    visitToBuyerConversion: calculateVisitToBuyerConversion(account),
    shopeeDiscountValue,
    shopeeDiscountSharePct,
    adDependencyPct: percentage(traffic.vendasShopeeAds, traffic.vendasTotais),
    roas,
    ctr,
    cpc,
    clickToOrderConversion: percentage(ads.pedidosAds, ads.cliques),
    // TACOS realizado tem base ÚNICA e estável: o investimento sobre as vendas reais do período.
    // (Não cai para a meta quando as vendas zeram — isso trocaria silenciosamente a definição da
    // métrica. O teto orientado à meta vive separado em availableAdsBudget/adsBudgetRemaining.)
    tacosUsedPct: percentage(ads.investimentoAds, account.vendas30d),
    targetProgressPct: percentage(account.vendas30d, config.metaFaturamento),
    revenueGapToTarget,
    ordersNeededToTarget,
    dailyRevenueNeededToTarget,
    dailyOrdersNeededToTarget,
    availableAdsBudget,
    adsBudgetRemaining: availableAdsBudget - ads.investimentoAds,
    contributionMarginValue: account.vendas30d * (config.margemContribuicaoPct / 100),
    sales30d: account.vendas30d,
    orders30d: account.pedidos30d,
    cancellations30d: account.cancelamentos30d,
    visitors: account.visitantes,
    buyers: account.compradores,
  };
};
