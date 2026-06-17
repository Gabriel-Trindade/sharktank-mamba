import { z } from "zod";

const numberSchema = z.coerce.number().finite().nonnegative();
const optionalNumberSchema = z.coerce.number().finite().nonnegative().optional();

export const adsStatusSchema = z
  .enum(["ativo", "inativo", "desconhecido"])
  .catch("desconhecido");

export const productRowSchema = z.object({
  sku: z.coerce.string().trim().min(1, "SKU é obrigatório"),
  produto: z.coerce.string().trim().min(1, "Produto é obrigatório"),
  categoria: z.coerce.string().trim().min(1, "Categoria é obrigatória"),
  marca: z.coerce.string().trim().optional(),
  custo: numberSchema,
  precoVenda: numberSchema,
  unidadesVendidas30d: numberSchema,
  gmv30d: numberSchema,
  estoque: optionalNumberSchema,
  adsStatus: adsStatusSchema.optional(),
  statusLogistica: z.coerce.string().trim().optional(),
  statusAnuncio: z.coerce.string().trim().optional(),
  urlProduto: z.coerce.string().trim().optional(),
  observacao: z.coerce.string().trim().optional(),
});

export const accountMetricsSchema = z.object({
  vendas30d: numberSchema,
  vendasPeriodoAnterior: numberSchema,
  vendasSemDesconto: optionalNumberSchema,
  pedidos30d: numberSchema,
  pedidosPeriodoAnterior: numberSchema,
  cancelamentos30d: numberSchema,
  cancelamentosPeriodoAnterior: numberSchema,
  visitantes: numberSchema,
  compradores: numberSchema,
});

export const trafficMetricsSchema = z.object({
  vendasTotais: numberSchema,
  vendasCardProduto: numberSchema,
  vendasLives: numberSchema,
  vendasVideoVendedor: numberSchema,
  vendasAfiliado: numberSchema,
  vendasShopeeAds: numberSchema,
});

export const adsMetricsSchema = z.object({
  impressoes: numberSchema,
  cliques: numberSchema,
  ctr: optionalNumberSchema,
  pedidosAds: numberSchema,
  itensVendidosAds: numberSchema,
  vendasAds: numberSchema,
  investimentoAds: numberSchema,
  roas: optionalNumberSchema,
});

export const promotionMetricsSchema = z.object({
  nome: z.coerce.string().trim().min(1, "Nome é obrigatório"),
  tipoDesconto: z.enum(["percentual", "valor_fixo"]),
  descontoAtualPct: numberSchema,
  descontoMaximoPct: numberSchema,
  vendasPromocao: numberSchema,
  unidadesVendidasPromocao: numberSchema,
  pedidosPromocao: numberSchema,
  compradoresPromocao: numberSchema,
});

export const marketBenchmarkSchema = z.object({
  categoria: z.coerce.string().trim().min(1, "Categoria é obrigatória"),
  palavraChave: z.coerce.string().trim().optional(),
  precoMedioMercado: numberSchema,
  precoMinMercado: optionalNumberSchema,
  precoMaxMercado: optionalNumberSchema,
  precoMedioSeller: numberSchema,
  fonte: z.coerce.string().trim().optional(),
});

export const scenarioConfigSchema = z.object({
  metaFaturamento: numberSchema,
  margemContribuicaoPct: numberSchema,
  tacosMaximoPct: numberSchema,
  descontoMaximoPct: numberSchema,
  descontoAtualPct: numberSchema,
  shopeeFullLiberado: z.boolean(),
  shopeeFullEmUso: z.boolean(),
});

export const sellerScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  products: z.array(productRowSchema),
  account: accountMetricsSchema,
  traffic: trafficMetricsSchema,
  ads: adsMetricsSchema,
  promotion: promotionMetricsSchema,
  market: z.array(marketBenchmarkSchema),
  config: scenarioConfigSchema,
});

export const saveScenarioInputSchema = sellerScenarioSchema.omit({
  id: true,
  createdAt: true,
});
