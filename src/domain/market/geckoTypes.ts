// Tipos da integração com a GeckoAPI (Shopee BR PLP).
// Doc: https://geckoapi.com.br/docs/shopee-com-br-plp/ e .../docs/account/

// Item bruto retornado em data.items[] pela GeckoAPI (Shopee PLP).
// Quase todos os campos podem vir ausentes ou null em produção.
export type GeckoShopeeItem = {
  url?: string;
  itemId?: string;
  shopId?: string;
  sku?: string;
  name?: string;
  currency?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  regularPrice?: number;
  discountPercentage?: number;
  soldCount?: number;
  likedCount?: number;
  stock?: number | null;
  brand?: string;
  thumbnail?: string;
  shopLocation?: string;
  sellerName?: string;
  sellerId?: string;
  sellerIsOfficialShop?: boolean | null;
  sellerIsShopeeVerified?: boolean | null;
  sellerIsPreferredPlus?: boolean | null;
  freeShipping?: boolean | null;
  sponsored?: boolean | null;
  aggregateRating?: {
    rating?: number | null;
    reviewCount?: number | null;
  };
};

export type GeckoShopeePlpData = {
  source?: string;
  type?: string;
  url?: string;
  query?: string;
  totalResults?: number;
  page?: number;
  resultsPerPage?: number;
  items?: GeckoShopeeItem[];
};

// Envelope da resposta. notFound:true vem com data:null e HTTP 200.
export type GeckoShopeePlpResponse = {
  requestId?: string;
  executionId?: string;
  notFound?: boolean;
  data?: GeckoShopeePlpData | null;
};

// GET /v1/me/credits
export type GeckoCreditsResponse = {
  userId?: string;
  currentCredits?: number;
  planId?: string;
};

export type GeckoCompetitor = {
  name: string;
  price: number | null;
  // origem: soldCount da listagem Shopee (não é venda mensal comprovada).
  soldCount: number | null;
  sellerName?: string;
  thumbnail?: string;
  url?: string;
  freeShipping?: boolean | null;
  sponsored?: boolean | null;
};

// Resultado normalizado, pronto para a UI do projeto.
export type MarketBenchmarkFromGecko = {
  source: string; // "GeckoAPI / Shopee PLP" | "GeckoAPI Mock / Shopee PLP"
  keyword: string;
  itemsAnalyzed: number;

  marketAveragePrice: number | null;
  marketMedianPrice: number | null;
  marketMinPrice: number | null;
  marketMaxPrice: number | null;

  // Atenção: somatório de soldCount da listagem, NÃO venda mensal comprovada.
  marketTotalSoldCount: number | null;
  marketAverageSoldCount: number | null;

  // Taxas em percentual (0-100), arredondadas.
  freeShippingRate: number | null;
  sponsoredRate: number | null;
  verifiedSellerRate: number | null;
  averageRating: number | null;
  averageReviewCount: number | null;

  topItems: GeckoCompetitor[];
};

export type GeckoBenchmarkStatus = "idle" | "loading" | "success" | "fallback" | "error";

export type GeckoErrorType =
  | "disabled"
  | "missing_key"
  | "unauthorized"
  | "insufficient_credits"
  | "rate_limit"
  | "timeout"
  | "not_found"
  | "server_error"
  | "unknown";

export type GeckoErrorInfo = {
  type: GeckoErrorType;
  message: string;
  shouldUseFallback: boolean;
};

// Resultado do service: sucesso traz benchmark normalizado; falha traz erro mapeado.
export type FetchBenchmarkOutcome =
  | { ok: true; benchmark: MarketBenchmarkFromGecko; source: "live" | "mock" | "cache" }
  | { ok: false; error: GeckoErrorInfo };
