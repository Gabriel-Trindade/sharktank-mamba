import { describe, expect, it } from "vitest";
import { normalizeGeckoShopeePlp } from "./normalizeGeckoShopeePlp";
import type { GeckoShopeeItem, GeckoShopeePlpResponse } from "./geckoTypes";

const response = (items: GeckoShopeeItem[]): GeckoShopeePlpResponse => ({
  requestId: "r",
  data: { items },
});

describe("normalizeGeckoShopeePlp", () => {
  it("usa mediana como preço de mercado e ignora preços inválidos", () => {
    const result = normalizeGeckoShopeePlp(
      response([
        { price: 10 },
        { price: 20 },
        { price: 30 },
        { price: 0 }, // descartado
        { price: -5 }, // descartado
        { price: null }, // descartado
        {}, // sem preço, descartado
      ]),
      "semi-joias",
      "GeckoAPI / Shopee PLP",
    );

    expect(result.itemsAnalyzed).toBe(3);
    expect(result.marketMedianPrice).toBe(20);
    expect(result.marketAveragePrice).toBe(20);
    expect(result.marketMinPrice).toBe(10);
    expect(result.marketMaxPrice).toBe(30);
  });

  it("calcula mediana par com média dos dois centrais", () => {
    const result = normalizeGeckoShopeePlp(
      response([{ price: 10 }, { price: 20 }, { price: 30 }, { price: 50 }]),
      "k",
      "s",
    );

    expect(result.marketMedianPrice).toBe(25);
  });

  it("ordena topItems por soldCount desc e limita a 5", () => {
    const result = normalizeGeckoShopeePlp(
      response([
        { name: "A", price: 10, soldCount: 100 },
        { name: "B", price: 10, soldCount: 900 },
        { name: "C", price: 10, soldCount: 500 },
        { name: "D", price: 10, soldCount: 700 },
        { name: "E", price: 10, soldCount: 50 },
        { name: "F", price: 10, soldCount: 800 },
      ]),
      "k",
      "s",
    );

    expect(result.topItems).toHaveLength(5);
    expect(result.topItems.map((i) => i.name)).toEqual(["B", "F", "D", "C", "A"]);
  });

  it("calcula taxas competitivas em percentual", () => {
    const result = normalizeGeckoShopeePlp(
      response([
        { price: 10, freeShipping: true, sponsored: true, sellerIsOfficialShop: true },
        { price: 12, freeShipping: true, sponsored: false, sellerIsShopeeVerified: true },
        { price: 14, freeShipping: false, sponsored: false },
        { price: 16, freeShipping: false, sponsored: false },
      ]),
      "k",
      "s",
    );

    expect(result.freeShippingRate).toBe(50);
    expect(result.sponsoredRate).toBe(25);
    expect(result.verifiedSellerRate).toBe(50);
  });

  it("não quebra com lista vazia ou data null", () => {
    const empty = normalizeGeckoShopeePlp({ data: null }, "k", "s");

    expect(empty.itemsAnalyzed).toBe(0);
    expect(empty.marketMedianPrice).toBeNull();
    expect(empty.marketTotalSoldCount).toBeNull();
    expect(empty.freeShippingRate).toBeNull();
    expect(empty.topItems).toEqual([]);
  });

  it("soma soldCount como volume total de mercado", () => {
    const result = normalizeGeckoShopeePlp(
      response([
        { price: 10, soldCount: 100 },
        { price: 12, soldCount: 200 },
      ]),
      "k",
      "s",
    );

    expect(result.marketTotalSoldCount).toBe(300);
    expect(result.marketAverageSoldCount).toBe(150);
  });
});
