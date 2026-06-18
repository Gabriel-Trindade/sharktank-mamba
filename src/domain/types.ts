export type AdsStatus = "ativo" | "inativo" | "desconhecido";

export type ProductClassification =
  | "anuncio_inativo"
  | "campeao_de_giro"
  | "prioridade_ads"
  | "verificar_ads"
  | "venda_por_sorte"
  | "candidato_promocao"
  | "produto_isca"
  | "nao_priorizar_cpc";

export type ProductRow = {
  sku: string;
  produto: string;
  categoria: string;
  marca?: string;
  custo: number;
  precoVenda: number;
  unidadesVendidas30d: number;
  gmv30d: number;
  estoque?: number;
  adsStatus?: AdsStatus;
  statusLogistica?: string;
  statusAnuncio?: string;
  urlProduto?: string;
  observacao?: string;
};

export type AccountMetrics = {
  vendas30d: number;
  vendasPeriodoAnterior: number;
  vendasSemDesconto?: number;
  pedidos30d: number;
  pedidosPeriodoAnterior: number;
  cancelamentos30d: number;
  cancelamentosPeriodoAnterior: number;
  visitantes: number;
  compradores: number;
};

export type TrafficMetrics = {
  vendasTotais: number;
  vendasCardProduto: number;
  vendasLives: number;
  vendasVideoVendedor: number;
  vendasAfiliado: number;
  vendasShopeeAds: number;
};

export type AdsMetrics = {
  impressoes: number;
  cliques: number;
  ctr?: number;
  pedidosAds: number;
  itensVendidosAds: number;
  vendasAds: number;
  investimentoAds: number;
  roas?: number;
};

export type PromotionMetrics = {
  nome: string;
  tipoDesconto: "percentual" | "valor_fixo";
  descontoAtualPct: number;
  descontoMaximoPct: number;
  vendasPromocao: number;
  unidadesVendidasPromocao: number;
  pedidosPromocao: number;
  compradoresPromocao: number;
};

export type MarketBenchmark = {
  categoria: string;
  palavraChave?: string;
  precoMedioMercado: number;
  precoMinMercado?: number;
  precoMaxMercado?: number;
  precoMedioSeller: number;
  fonte?: string;
};

export type ScenarioConfig = {
  metaFaturamento: number;
  margemContribuicaoPct: number;
  tacosMaximoPct: number;
  descontoMaximoPct: number;
  descontoAtualPct: number;
  shopeeFullLiberado: boolean;
  shopeeFullEmUso: boolean;
};

export type SellerScenario = {
  id: string;
  name: string;
  createdAt: string;
  products: ProductRow[];
  account: AccountMetrics;
  traffic: TrafficMetrics;
  ads: AdsMetrics;
  promotion: PromotionMetrics;
  market: MarketBenchmark[];
  config: ScenarioConfig;
};

export type ScoreBand =
  | "baixa_prioridade"
  | "observar_otimizar"
  | "boa_oportunidade"
  | "prioridade_maxima";

export type ProductAnalysis = {
  sku: string;
  produto: string;
  categoria: string;
  marca?: string;
  custo: number;
  precoVenda: number;
  unidadesVendidas30d: number;
  gmv30d: number;
  estoque?: number;
  adsStatus: AdsStatus;
  margemValor: number;
  margemPct: number;
  score: number;
  scoreBand: ScoreBand;
  classifications: ProductClassification[];
  isCurveA: boolean;
  isCurveAGmv: boolean;
  isCurveAUnits: boolean;
  marketGapRatio: number;
  marketGapPct: number;
  reading: string;
  recommendedAction: string;
};

export type MarketAnalysis = {
  categoria: string;
  palavraChave?: string;
  precoMedioMercado: number;
  precoMedioSeller: number;
  precoMinMercado?: number;
  precoMaxMercado?: number;
  // Posição do preço do seller frente à faixa observada (min–max) do mercado.
  // `null` quando não há faixa informada para comparar.
  sellerPriceVsBand: "abaixo" | "dentro" | "acima" | null;
  gapRatio: number;
  gapPct: number;
  highGap: boolean;
  reading: string;
};

export type AnalysisResult = {
  overview: {
    salesDropPct: number;
    salesGrowthPct: number;
    ordersDropPct: number;
    cancellationGrowthPct: number;
    averageTicket: number;
    visitToBuyerConversion: number;
    shopeeDiscountValue: number;
    shopeeDiscountSharePct: number;
    adDependencyPct: number;
    roas: number;
    ctr: number;
    cpc: number;
    clickToOrderConversion: number;
    tacosUsedPct: number;
    targetProgressPct: number;
    revenueGapToTarget: number;
    ordersNeededToTarget: number;
    dailyRevenueNeededToTarget: number;
    dailyOrdersNeededToTarget: number;
    availableAdsBudget: number;
    adsBudgetRemaining: number;
    contributionMarginValue: number;
    sales30d: number;
    orders30d: number;
    cancellations30d: number;
    visitors: number;
    buyers: number;
  };
  products: ProductAnalysis[];
  market: MarketAnalysis[];
  insights: Insight[];
  recoveryPlan: RecoveryAction[];
};

export type Insight = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  evidence: string;
};

export type RecoveryAction = {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  problem: string;
  evidence: string;
  action: string;
  expectedImpact: string;
  complexity: "baixa" | "media" | "alta";
};
