import type { SaveScenarioInput } from "../services/fakeApi";
import type { SellerScenario } from "../domain/types";
import { isLiveGeckoCategory } from "../domain/market/categoryKey";

export type AppSectionId =
  | "produtos"
  | "conta"
  | "trafego"
  | "ads"
  | "promocoes"
  | "mercado"
  | "diagnostico";

export type AppSection = {
  id: AppSectionId;
  label: string;
  description: string;
};

export const appSections: AppSection[] = [
  { id: "produtos", label: "Produtos", description: "Importe a planilha de produtos." },
  { id: "conta", label: "Conta", description: "Informe vendas, pedidos e cancelamentos." },
  { id: "trafego", label: "Tráfego", description: "Separe a origem das vendas." },
  { id: "ads", label: "Ads", description: "Informe entrega, cliques e investimento." },
  { id: "promocoes", label: "Promoções", description: "Defina desconto, resultado promocional e limites do cenário." },
  { id: "mercado", label: "Mercado", description: "Busque o benchmark de mercado na Shopee." },
  { id: "diagnostico", label: "Diagnóstico", description: "Gere o plano de recuperação." },
];

export const createEmptyScenarioDraft = (): SaveScenarioInput => ({
  name: "Cenário manual",
  products: [],
  account: {
    vendas30d: 0,
    vendasPeriodoAnterior: 0,
    vendasSemDesconto: 0,
    pedidos30d: 0,
    pedidosPeriodoAnterior: 0,
    cancelamentos30d: 0,
    cancelamentosPeriodoAnterior: 0,
    visitantes: 0,
    compradores: 0,
  },
  traffic: {
    vendasTotais: 0,
    vendasCardProduto: 0,
    vendasLives: 0,
    vendasVideoVendedor: 0,
    vendasAfiliado: 0,
    vendasShopeeAds: 0,
  },
  ads: {
    impressoes: 0,
    cliques: 0,
    pedidosAds: 0,
    itensVendidosAds: 0,
    vendasAds: 0,
    investimentoAds: 0,
  },
  promotion: {
    nome: "Promoção principal",
    tipoDesconto: "percentual",
    descontoAtualPct: 0,
    descontoMaximoPct: 0,
    vendasPromocao: 0,
    unidadesVendidasPromocao: 0,
    pedidosPromocao: 0,
    compradoresPromocao: 0,
  },
  market: [],
  config: {
    metaFaturamento: 0,
    margemContribuicaoPct: 0,
    tacosMaximoPct: 0,
    descontoMaximoPct: 0,
    descontoAtualPct: 0,
    shopeeFullLiberado: false,
    shopeeFullEmUso: false,
  },
});

export const scenarioToDraft = (scenario: SellerScenario): SaveScenarioInput => ({
  name: scenario.name,
  products: scenario.products,
  account: scenario.account,
  traffic: scenario.traffic,
  ads: scenario.ads,
  promotion: scenario.promotion,
  market: scenario.market,
  config: scenario.config,
});

// Draft para apresentação: nas categorias que consultam a GeckoAPI ao vivo,
// zera o lado do mercado (preço médio/min/máx e fonte) mantendo só os dados do
// seller, para que sejam buscados ao vivo no pitch. As demais categorias ficam
// com o benchmark estático (Joompulse) intacto, apenas para exibição.
export const toPresentationDraft = (scenario: SellerScenario): SaveScenarioInput => {
  const base = scenarioToDraft(scenario);

  return {
    ...base,
    market: base.market.map((item) =>
      isLiveGeckoCategory(item.categoria)
        ? {
            ...item,
            precoMedioMercado: 0,
            precoMinMercado: undefined,
            precoMaxMercado: undefined,
            fonte: "",
          }
        : item,
    ),
  };
};
