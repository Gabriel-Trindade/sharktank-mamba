import type { AnalysisResult, Insight, SellerScenario } from "../types";
import { hasHighAdDependency, hasWeakOrganicSupport } from "../calculations/ads";
import { hasHighCancellation, hasLowConversion, hasOrdersDrop, hasSalesDrop } from "../calculations/account";
import {
  calculatePromotionHeadroomPct,
  calculatePromotionSharePct,
  calculatePromotionTicket,
  isPromotionUnderused,
} from "../calculations/promotions";
import { formatCurrency, formatInteger, formatPercent } from "../formatters";

export const generateInsights = (
  scenario: SellerScenario,
  partialResult: Pick<AnalysisResult, "overview" | "products" | "market">,
): Insight[] => {
  const insights: Insight[] = [];

  if (hasSalesDrop(scenario.account)) {
    insights.push({
      id: "sales-drop",
      severity: "high",
      title: "Queda de vendas detectada",
      description: "O faturamento atual está abaixo do registrado nos 30 dias anteriores — a queda se acumulou ao longo do período de assessoria.",
      evidence: `Atual: ${formatCurrency(scenario.account.vendas30d)} / 30 dias anteriores: ${formatCurrency(scenario.account.vendasPeriodoAnterior)}.`,
    });
  }

  if (hasOrdersDrop(scenario.account)) {
    insights.push({
      id: "orders-drop",
      severity: "medium",
      title: "Pedidos em queda",
      description: "A receita caiu junto com o volume de pedidos, sinalizando problema de demanda ou conversão.",
      evidence: `${scenario.account.pedidos30d} pedidos contra ${scenario.account.pedidosPeriodoAnterior}.`,
    });
  }

  if (hasHighCancellation(scenario.account)) {
    insights.push({
      id: "high-cancellation",
      severity: "high",
      title: "Cancelamento acima do limite",
      description: "Cancelamentos consomem margem, ranqueamento e previsibilidade de estoque.",
      evidence: `${scenario.account.cancelamentos30d} cancelamentos em ${scenario.account.pedidos30d} pedidos.`,
    });
  }

  if (hasLowConversion(scenario.account)) {
    insights.push({
      id: "low-conversion",
      severity: "high",
      title: "Conversão de visitantes baixa",
      description: "O funil recebe visitantes, mas transforma poucos em compradores.",
      evidence: `Conversão visitante-comprador de ${formatPercent(partialResult.overview.visitToBuyerConversion)}.`,
    });
  }

  if (hasHighAdDependency(scenario.traffic)) {
    insights.push({
      id: "high-ad-dependency",
      severity: "high",
      title: "Dependência alta de Shopee Ads",
      description: "Grande parte da receita depende de mídia paga, aumentando o risco de margem.",
      evidence: `${formatPercent(partialResult.overview.adDependencyPct)} das vendas vieram de Ads.`,
    });
  }

  if (hasWeakOrganicSupport(scenario.traffic)) {
    insights.push({
      id: "weak-organic",
      severity: "medium",
      title: "Apoio orgânico fraco",
      description: "Lives, vídeos e afiliados ainda não sustentam descoberta fora de Ads.",
      evidence: `Lives ${formatCurrency(scenario.traffic.vendasLives)}, vídeo ${formatCurrency(scenario.traffic.vendasVideoVendedor)}, afiliados ${formatCurrency(scenario.traffic.vendasAfiliado)}.`,
    });
  }

  if (isPromotionUnderused(scenario.promotion, scenario.config)) {
    const promotionSharePct = calculatePromotionSharePct(scenario.promotion, scenario.account.vendas30d);
    const promotionTicket = calculatePromotionTicket(scenario.promotion);

    insights.push({
      id: "promotion-underused",
      severity: "medium",
      title: "Promoção subutilizada",
      description: "Existe espaço de desconto e a promoção ainda pode ser usada como teste controlado de conversão.",
      evidence: `${formatPercent(calculatePromotionHeadroomPct(scenario.promotion, scenario.config))} de espaço; promoção representa ${formatPercent(promotionSharePct)} das vendas, com ticket de ${formatCurrency(promotionTicket)}.`,
    });
  }

  if (scenario.config.shopeeFullLiberado && !scenario.config.shopeeFullEmUso) {
    insights.push({
      id: "full-underused",
      severity: "medium",
      title: "Shopee FULL disponível e não usado",
      description: "FULL pode reduzir fricção logística em produtos de maior giro.",
      evidence: "Configuração informa FULL liberado, mas fora de uso.",
    });
  }

  const highGap = partialResult.market.find((item) => item.highGap);
  if (highGap) {
    insights.push({
      id: "market-gap",
      severity: "high",
      title: "Gap de mercado alto",
      description: "Preço médio do seller está muito distante do preço médio de mercado.",
      evidence: `${highGap.categoria}: gap de ${formatPercent(highGap.gapPct)}.`,
    });
  }

  const inactiveListings = partialResult.products.filter((item) =>
    item.classifications.includes("anuncio_inativo"),
  );
  if (inactiveListings.length > 0) {
    insights.push({
      id: "inactive-listings",
      severity: "high",
      title: "Anúncios pausados ou inativos",
      description: "Produtos com anúncio fora da vitrine não vendem nem organicamente nem com Ads.",
      evidence: `${inactiveListings.length} anúncio(s) inativo(s): ${inactiveListings.slice(0, 3).map((item) => item.produto).join(", ")}.`,
    });
  }

  const priorityProducts = partialResult.products.filter((item) =>
    item.classifications.includes("prioridade_ads"),
  );
  if (priorityProducts.length > 0) {
    insights.push({
      id: "ads-priority-products",
      severity: "medium",
      title: "Produtos prontos para teste de Ads",
      description: "Há itens com giro e margem que ainda não usam Ads ativo.",
      evidence: priorityProducts.slice(0, 3).map((item) => item.produto).join(", "),
    });
  }

  const verifyAdsProducts = partialResult.products.filter((item) =>
    item.classifications.includes("verificar_ads"),
  );
  if (verifyAdsProducts.length > 0) {
    insights.push({
      id: "verify-ads-products",
      severity: "medium",
      title: "Campeões a confirmar no painel de Ads",
      description: "Há campeões de giro com margem cujo status de Ads não foi informado. Confirme se já existe campanha antes de decidir ativar ou reduzir verba.",
      evidence: verifyAdsProducts.slice(0, 3).map((item) => item.produto).join(", "),
    });
  }

  insights.push(...generateDataConsistencyInsights(scenario));

  return insights;
};

const generateDataConsistencyInsights = (scenario: SellerScenario): Insight[] => {
  const insights: Insight[] = [];
  const trafficSalesDiffPct = differencePct(scenario.traffic.vendasTotais, scenario.account.vendas30d);
  const productsGmv = scenario.products.reduce((sum, product) => sum + product.gmv30d, 0);
  const productsGmvDiffPct = differencePct(productsGmv, scenario.account.vendas30d);
  const inconsistentProducts = scenario.products.filter((product) => {
    const calculatedGmv = product.precoVenda * product.unidadesVendidas30d;

    return Math.abs(product.gmv30d - calculatedGmv) > 5 && differencePct(product.gmv30d, calculatedGmv) > 3;
  });

  if (scenario.traffic.vendasTotais > 0 && scenario.account.vendas30d > 0 && trafficSalesDiffPct > 5) {
    insights.push({
      id: "traffic-sales-mismatch",
      severity: "medium",
      title: "Vendas por canal não batem com vendas 30d",
      description: "A soma informada em tráfego diverge do faturamento geral da conta.",
      evidence: `${formatCurrency(scenario.traffic.vendasTotais)} em canais contra ${formatCurrency(scenario.account.vendas30d)} na conta.`,
    });
  }

  // A "contribuição de anúncios" do tráfego usa atribuição direta e tende a ser MENOR que a
  // receita do painel de Ads (janela de atribuição mais ampla). Só sinalizamos divergência
  // quando a contribuição direta supera a do painel — aí sim há erro nos dados informados.
  if (
    scenario.traffic.vendasShopeeAds > 0 &&
    scenario.ads.vendasAds > 0 &&
    scenario.traffic.vendasShopeeAds > scenario.ads.vendasAds * 1.05
  ) {
    insights.push({
      id: "ads-sales-mismatch",
      severity: "medium",
      title: "Vendas Ads divergentes",
      description: "A contribuição de Ads no tráfego superou a receita do painel de Ads — revise a atribuição informada.",
      evidence: `${formatCurrency(scenario.traffic.vendasShopeeAds)} no tráfego contra ${formatCurrency(scenario.ads.vendasAds)} no painel de Ads.`,
    });
  }

  if (productsGmv > 0 && scenario.account.vendas30d > 0 && productsGmvDiffPct > 15) {
    insights.push({
      id: "product-gmv-mismatch",
      severity: "medium",
      title: "GMV de produtos incompleto ou divergente",
      description: "A soma dos produtos importados não representa bem o faturamento da conta.",
      evidence: `${formatCurrency(productsGmv)} em produtos contra ${formatCurrency(scenario.account.vendas30d)} na conta.`,
    });
  }

  if (inconsistentProducts.length > 0) {
    insights.push({
      id: "product-row-gmv-mismatch",
      severity: "low",
      title: "Linhas de produto com GMV inconsistente",
      description: "Há produtos em que preço vezes unidades não fecha com o GMV informado.",
      evidence: inconsistentProducts.slice(0, 3).map((product) => product.sku).join(", "),
    });
  }

  if (scenario.account.compradores > scenario.account.visitantes || scenario.account.compradores > scenario.account.pedidos30d) {
    insights.push({
      id: "buyer-count-invalid",
      severity: "high",
      title: "Compradores acima do esperado",
      description: "Compradores não deveriam superar visitantes nem pedidos no mesmo período.",
      evidence: `${formatInteger(scenario.account.compradores)} compradores, ${formatInteger(scenario.account.visitantes)} visitantes e ${formatInteger(scenario.account.pedidos30d)} pedidos.`,
    });
  }

  // Cada pedido de Ads carrega ao menos 1 item — itens vendidos abaixo de pedidos é dado impossível.
  if (scenario.ads.pedidosAds > 0 && scenario.ads.itensVendidosAds < scenario.ads.pedidosAds) {
    insights.push({
      id: "ads-items-invalid",
      severity: "high",
      title: "Itens vendidos por Ads abaixo dos pedidos",
      description: "Cada pedido tem ao menos um item; itens vendidos não podem ser menores que pedidos.",
      evidence: `${formatInteger(scenario.ads.itensVendidosAds)} itens para ${formatInteger(scenario.ads.pedidosAds)} pedidos de Ads.`,
    });
  }

  // Mesma lógica para a promoção: unidades ≥ pedidos e compradores ≤ pedidos.
  if (scenario.promotion.pedidosPromocao > 0 && scenario.promotion.unidadesVendidasPromocao < scenario.promotion.pedidosPromocao) {
    insights.push({
      id: "promotion-units-invalid",
      severity: "medium",
      title: "Unidades da promoção abaixo dos pedidos",
      description: "Unidades vendidas na promoção não podem ser menores que o número de pedidos.",
      evidence: `${formatInteger(scenario.promotion.unidadesVendidasPromocao)} unidades para ${formatInteger(scenario.promotion.pedidosPromocao)} pedidos na promoção.`,
    });
  }

  if (scenario.promotion.pedidosPromocao > 0 && scenario.promotion.compradoresPromocao > scenario.promotion.pedidosPromocao) {
    insights.push({
      id: "promotion-buyers-invalid",
      severity: "medium",
      title: "Compradores da promoção acima dos pedidos",
      description: "Compradores da promoção não deveriam superar o número de pedidos no mesmo período.",
      evidence: `${formatInteger(scenario.promotion.compradoresPromocao)} compradores para ${formatInteger(scenario.promotion.pedidosPromocao)} pedidos na promoção.`,
    });
  }

  // Vendas sem os descontos da Shopee não podem superar o faturamento bruto (vendas30d).
  if (
    scenario.account.vendasSemDesconto !== undefined &&
    scenario.account.vendasSemDesconto > scenario.account.vendas30d
  ) {
    insights.push({
      id: "net-sales-above-gross",
      severity: "medium",
      title: "Vendas sem desconto acima do bruto",
      description: "O faturamento sem os descontos da Shopee não deveria superar o faturamento bruto.",
      evidence: `${formatCurrency(scenario.account.vendasSemDesconto)} sem desconto contra ${formatCurrency(scenario.account.vendas30d)} bruto.`,
    });
  }

  return insights;
};

const differencePct = (first: number, second: number) => {
  const denominator = Math.max(Math.abs(first), Math.abs(second), 1);

  return (Math.abs(first - second) / denominator) * 100;
};
