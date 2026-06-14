import type { AnalysisResult, ProductAnalysis, RecoveryAction, SellerScenario } from "../types";
import { hasHighAdDependency, hasWeakOrganicSupport } from "../calculations/ads";
import { hasHighCancellation, hasLowConversion, hasSalesDrop } from "../calculations/account";
import { calculatePromotionHeadroomPct, isPromotionUnderused } from "../calculations/promotions";
import { formatCurrency, formatPercent } from "../formatters";

export const generateRecoveryPlan = (
  scenario: SellerScenario,
  result: Pick<AnalysisResult, "overview" | "products" | "market">,
): RecoveryAction[] => {
  const actions: RecoveryAction[] = [];
  const topProducts = getExecutionProducts(result.products);
  const topProductNames = topProducts.map((product) => product.produto).join(", ");

  if (hasSalesDrop(scenario.account)) {
    actions.push({
      id: "recover-sales-base",
      priority: 1,
      title: "Fechar o gap até a meta de faturamento",
      problem: "A receita recente está abaixo do patamar necessário para voltar à meta.",
      evidence: `Faltam ${formatCurrency(result.overview.revenueGapToTarget)} para a meta, cerca de ${result.overview.ordersNeededToTarget} pedidos no ticket atual.`,
      action: topProductNames
        ? `Executar rotina semanal de preço, estoque e oferta nos SKUs com melhor score: ${topProductNames}.`
        : "Executar rotina semanal de preço, estoque e oferta nos SKUs com melhor score.",
      expectedImpact: `Buscar ${formatCurrency(result.overview.dailyRevenueNeededToTarget)} por dia de receita incremental até fechar o gap.`,
      complexity: "media",
    });
  }

  if (hasHighCancellation(scenario.account)) {
    actions.push({
      id: "reduce-cancellations",
      priority: 1,
      title: "Reduzir cancelamentos antes de escalar demanda",
      problem: "Cancelamentos acima de 8% corroem margem e reputação.",
      evidence: `${scenario.account.cancelamentos30d} cancelamentos em ${scenario.account.pedidos30d} pedidos.`,
      action: "Revisar estoque, prazo, integração logística e promessas dos SKUs campeões.",
      expectedImpact: "Aumentar pedidos líquidos e proteger ranqueamento.",
      complexity: "media",
    });
  }

  if (hasLowConversion(scenario.account)) {
    actions.push({
      id: "fix-conversion",
      priority: 2,
      title: "Corrigir gargalos de conversão",
      problem: "Visitantes não estão virando compradores no ritmo esperado.",
      evidence: `Conversão de ${formatPercent(result.overview.visitToBuyerConversion)}.`,
      action: "Ajustar primeiras imagens, título, cupom, prova social e frete dos itens com tráfego.",
      expectedImpact: "Aumentar pedidos sem elevar investimento de Ads.",
      complexity: "media",
    });
  }

  if (hasHighAdDependency(scenario.traffic)) {
    actions.push({
      id: "rebalance-ads",
      priority: 2,
      title: "Reduzir dependência de Ads",
      problem: "Receita concentrada em Shopee Ads deixa o resultado vulnerável a CPC e ROAS.",
      evidence: `${formatPercent(result.overview.adDependencyPct)} da venda vem de Ads; TACOS usado está em ${formatPercent(result.overview.tacosUsedPct)} para limite de ${formatPercent(scenario.config.tacosMaximoPct)}.`,
      action: "Separar campanhas por Curva A de giro, pausar CPC em venda por sorte, gap alto ou estoque zerado, e concentrar verba nos campeões com margem.",
      expectedImpact: `Preservar o teto de Ads de ${formatCurrency(result.overview.availableAdsBudget)} e reduzir desperdício de verba.`,
      complexity: "alta",
    });
  }

  const highGap = result.market.find((item) => item.highGap);
  if (highGap) {
    actions.push({
      id: "fix-market-gap",
      priority: 2,
      title: "Corrigir gap de preço contra mercado",
      problem: "Preço médio do seller está muito acima do benchmark.",
      evidence: `${highGap.categoria} tem gap de ${formatPercent(highGap.gapPct)}.`,
      action: "Reavaliar sortimento, frete, kits e desconto para aproximar a oferta do mercado sem remover produtos premium.",
      expectedImpact: "Reduzir rejeição por preço e melhorar conversão.",
      complexity: "media",
    });
  }

  const lowLiquidity = result.market.find((item) => item.lowLiquidity);
  if (lowLiquidity) {
    actions.push({
      id: "fix-low-liquidity",
      priority: 2,
      title: "Criar ponte de liquidez com produtos de entrada",
      problem: "O seller gira poucas unidades frente ao mercado, mesmo tendo produto premium.",
      evidence: `${lowLiquidity.categoria} representa ${formatPercent(lowLiquidity.unitSharePct)} das unidades do benchmark.`,
      action: "Adicionar ou destacar itens de entrada e kits abaixo do ticket médio para capturar volume sem desligar o mix premium.",
      expectedImpact: "Aumentar pedidos e sinais de venda recorrente antes de ampliar CPC.",
      complexity: "media",
    });
  }

  if (hasWeakOrganicSupport(scenario.traffic)) {
    actions.push({
      id: "activate-organic-channels",
      priority: 3,
      title: "Ativar canais orgânicos de apoio",
      problem: "Lives, vídeos ou afiliados não estão compondo o funil.",
      evidence: `Afiliados geraram ${formatCurrency(scenario.traffic.vendasAfiliado)}.`,
      action: "Selecionar produtos isca e campeões para vídeos curtos, afiliados e lives de oferta.",
      expectedImpact: "Criar descoberta adicional sem depender apenas de mídia paga.",
      complexity: "media",
    });
  }

  if (isPromotionUnderused(scenario.promotion, scenario.config)) {
    actions.push({
      id: "use-promotion-headroom",
      priority: 3,
      title: "Usar espaço de promoção com limite de margem",
      problem: "O desconto atual está distante do desconto máximo permitido.",
      evidence: `${formatPercent(scenario.config.descontoAtualPct)} atual contra ${formatPercent(scenario.config.descontoMaximoPct)} máximo.`,
      action: `Aplicar teste incremental de até ${formatPercent(calculatePromotionHeadroomPct(scenario.promotion, scenario.config))} nos candidatos à promoção e medir lift de unidades.`,
      expectedImpact: "Ganhar conversão usando somente o espaço promocional aprovado pelo seller.",
      complexity: "baixa",
    });
  }

  if (scenario.config.shopeeFullLiberado && !scenario.config.shopeeFullEmUso) {
    actions.push({
      id: "enable-shopee-full",
      priority: 3,
      title: "Testar Shopee FULL nos itens de maior giro",
      problem: "FULL está liberado, mas não está sendo usado.",
      evidence: "Configuração do cenário indica FULL disponível e inativo.",
      action: "Migrar campeões de giro com estoque saudável para FULL e medir conversão e prazo.",
      expectedImpact: "Reduzir fricção logística e melhorar atratividade da oferta.",
      complexity: "media",
    });
  }

  const priorityAdsProduct = result.products.find((item) =>
    item.classifications.includes("prioridade_ads"),
  );
  if (priorityAdsProduct) {
    actions.push({
      id: "activate-priority-ads",
      priority: 4,
      title: "Ativar Ads controlado em campeões sem campanha",
      problem: "Há produto com giro, margem e Ads inativo.",
      evidence: `${priorityAdsProduct.produto} tem score ${priorityAdsProduct.score}.`,
      action: "Criar campanha com limite diário, palavras exatas e revisão de ROAS em 7 dias.",
      expectedImpact: `Capturar demanda incremental sem ultrapassar a verba restante de ${formatCurrency(result.overview.adsBudgetRemaining)} pelo TACOS.`,
      complexity: "baixa",
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
};

const getExecutionProducts = (products: ProductAnalysis[]) =>
  products
    .filter((product) => !product.classifications.includes("nao_priorizar_cpc") && product.estoque !== 0)
    .slice(0, 5);
