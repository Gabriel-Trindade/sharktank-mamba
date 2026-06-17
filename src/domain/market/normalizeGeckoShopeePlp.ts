import { round, safeDivide } from "../calculations/math";
import type {
  GeckoCompetitor,
  GeckoShopeeItem,
  GeckoShopeePlpResponse,
  MarketBenchmarkFromGecko,
} from "./geckoTypes";

const isValidPrice = (price: unknown): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0;

const isValidCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Taxa em percentual (0-100). Retorna null quando não há base de itens.
const ratePercent = (count: number, total: number): number | null =>
  total === 0 ? null : round(safeDivide(count, total) * 100, 1);

const isVerifiedSeller = (item: GeckoShopeeItem) =>
  item.sellerIsOfficialShop === true ||
  item.sellerIsShopeeVerified === true ||
  item.sellerIsPreferredPlus === true;

const toCompetitor = (item: GeckoShopeeItem): GeckoCompetitor => ({
  name: item.name?.trim() || "Produto sem nome",
  price: isValidPrice(item.price) ? round(item.price, 2) : null,
  soldCount: isValidCount(item.soldCount) ? item.soldCount : null,
  sellerName: item.sellerName,
  thumbnail: item.thumbnail,
  url: item.url,
  freeShipping: item.freeShipping ?? null,
  sponsored: item.sponsored ?? null,
});

/**
 * Transforma a resposta da GeckoAPI (Shopee PLP) em uma estrutura simples do projeto.
 * - Ignora preços nulos/<= 0.
 * - Usa mediana como valor principal de mercado (média fica como apoio).
 * - Ordena topItems por soldCount desc e limita a 5.
 * - Nunca quebra se campos vierem ausentes.
 */
export const normalizeGeckoShopeePlp = (
  response: GeckoShopeePlpResponse,
  keyword: string,
  source: string,
): MarketBenchmarkFromGecko => {
  const items = response.data?.items ?? [];
  const total = items.length;

  const prices = items.map((item) => item.price).filter(isValidPrice);
  const soldCounts = items.map((item) => item.soldCount).filter(isValidCount);
  const ratings = items
    .map((item) => item.aggregateRating?.rating)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const reviews = items
    .map((item) => item.aggregateRating?.reviewCount)
    .filter(isValidCount);

  const totalSold = soldCounts.length ? sum(soldCounts) : null;

  const topItems = [...items]
    .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
    .slice(0, 5)
    .map(toCompetitor);

  return {
    source,
    keyword,
    itemsAnalyzed: prices.length,

    marketAveragePrice: prices.length ? round(sum(prices) / prices.length, 2) : null,
    marketMedianPrice: prices.length ? round(median(prices) as number, 2) : null,
    marketMinPrice: prices.length ? round(Math.min(...prices), 2) : null,
    marketMaxPrice: prices.length ? round(Math.max(...prices), 2) : null,

    marketTotalSoldCount: totalSold,
    marketAverageSoldCount: soldCounts.length ? round((totalSold as number) / soldCounts.length, 0) : null,

    freeShippingRate: ratePercent(items.filter((item) => item.freeShipping === true).length, total),
    sponsoredRate: ratePercent(items.filter((item) => item.sponsored === true).length, total),
    verifiedSellerRate: ratePercent(items.filter(isVerifiedSeller).length, total),
    averageRating: ratings.length ? round(sum(ratings) / ratings.length, 2) : null,
    averageReviewCount: reviews.length ? round(sum(reviews) / reviews.length, 0) : null,

    topItems,
  };
};
