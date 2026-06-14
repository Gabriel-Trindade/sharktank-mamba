import type {
  AccountMetrics,
  MarketBenchmark,
  ProductAnalysis,
  ProductClassification,
  ProductRow,
  ScenarioConfig,
} from "../types";
import { findMarketForCategory } from "./market";
import { safeDivide } from "./math";
import { calculateAverageTicket } from "./account";
import { calculateOpportunityScore, scoreBand } from "./score";
import { classifyProduct } from "../rules/product-classification";

export const calculateMarginValue = (product: ProductRow) => product.precoVenda - product.custo;

export const calculateMarginPct = (product: ProductRow) =>
  safeDivide(calculateMarginValue(product), product.precoVenda) * 100;

export const analyzeProducts = (
  products: ProductRow[],
  market: MarketBenchmark[],
  account: AccountMetrics,
  config: ScenarioConfig,
): ProductAnalysis[] => {
  const averageTicket = calculateAverageTicket(account);
  const curveAGmvSkus = buildCurveASet(products, "gmv30d");
  const curveAUnitsSkus = buildCurveASet(products, "unidadesVendidas30d");

  return [...products]
    .sort((a, b) => b.gmv30d - a.gmv30d)
    .map((product) => {
      const marketplace = findMarketForCategory(market, product.categoria);
      const marketGapRatio = marketplace ? safeDivide(product.precoVenda, marketplace.precoMedioMercado) : 1;
      const marketGapPct = marketplace
        ? safeDivide(product.precoVenda - marketplace.precoMedioMercado, marketplace.precoMedioMercado) * 100
        : 0;
      const classifications = classifyProduct(product, {
        products,
        market,
        averageTicket,
        config,
      });
      const score = calculateOpportunityScore(product, { products, market });
      const isCurveAGmv = curveAGmvSkus.has(product.sku);
      const isCurveAUnits = curveAUnitsSkus.has(product.sku);

      return {
        sku: product.sku,
        produto: product.produto,
        categoria: product.categoria,
        marca: product.marca,
        custo: product.custo,
        precoVenda: product.precoVenda,
        unidadesVendidas30d: product.unidadesVendidas30d,
        gmv30d: product.gmv30d,
        estoque: product.estoque,
        adsStatus: product.adsStatus ?? "desconhecido",
        margemValor: calculateMarginValue(product),
        margemPct: calculateMarginPct(product),
        score,
        scoreBand: scoreBand(score),
        classifications,
        isCurveA: isCurveAGmv,
        isCurveAGmv,
        isCurveAUnits,
        marketGapRatio,
        marketGapPct,
        reading: buildProductReading(classifications, marketGapRatio),
        recommendedAction: buildProductAction(classifications),
      };
    });
};

const buildCurveASet = (products: ProductRow[], key: "gmv30d" | "unidadesVendidas30d") => {
  const total = products.reduce((sum, product) => sum + product[key], 0);
  const curveSkus = new Set<string>();
  let accumulated = 0;

  if (total <= 0) {
    return curveSkus;
  }

  [...products]
    .sort((a, b) => b[key] - a[key])
    .forEach((product) => {
      if (accumulated / total < 0.8) {
        curveSkus.add(product.sku);
      }

      accumulated += product[key];
    });

  return curveSkus;
};

const buildProductReading = (classifications: ProductClassification[], marketGapRatio: number) => {
  if (classifications.includes("prioridade_ads")) {
    return "Produto com giro e margem, mas sem Ads ativo.";
  }

  if (classifications.includes("venda_por_sorte")) {
    return "Venda concentrada em poucas unidades; validar recorrência antes de investir.";
  }

  if (classifications.includes("nao_priorizar_cpc")) {
    return "Ticket alto e baixo giro reduzem prioridade para compra de clique.";
  }

  if (marketGapRatio >= 2.5) {
    return "Preço muito distante do mercado; revisar oferta antes de escalar.";
  }

  return "Produto elegível para acompanhamento no plano de recuperação.";
};

const buildProductAction = (classifications: ProductClassification[]) => {
  if (classifications.includes("prioridade_ads")) {
    return "Ativar campanha controlada e medir ROAS por 7 dias.";
  }

  if (classifications.includes("candidato_promocao")) {
    return "Testar desconto dentro da margem máxima permitida.";
  }

  if (classifications.includes("produto_isca")) {
    return "Usar como entrada de volume para aumentar tráfego qualificado.";
  }

  if (classifications.includes("nao_priorizar_cpc")) {
    return "Priorizar ajuste de preço, título e prova social antes de Ads.";
  }

  return "Manter monitoramento de margem, estoque e conversão.";
};
