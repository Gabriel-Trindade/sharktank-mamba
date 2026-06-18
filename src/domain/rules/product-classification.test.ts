import { describe, expect, it } from "vitest";
import { classifyProduct, isRotationChampion } from "./product-classification";
import type { ProductRow, ScenarioConfig } from "../types";

const config: ScenarioConfig = {
  metaFaturamento: 10000,
  margemContribuicaoPct: 30,
  tacosMaximoPct: 12,
  descontoMaximoPct: 15,
  descontoAtualPct: 5,
  shopeeFullLiberado: true,
  shopeeFullEmUso: false,
};

const products: ProductRow[] = [
  {
    sku: "A",
    produto: "Campeao sem Ads",
    categoria: "Beleza",
    custo: 20,
    precoVenda: 80,
    unidadesVendidas30d: 12,
    gmv30d: 960,
    estoque: 20,
    adsStatus: "inativo",
  },
  {
    sku: "B",
    produto: "Venda por sorte",
    categoria: "Moda",
    custo: 40,
    precoVenda: 180,
    unidadesVendidas30d: 1,
    gmv30d: 180,
    estoque: 10,
    adsStatus: "inativo",
  },
  {
    sku: "C",
    produto: "Baixo giro",
    categoria: "Casa",
    custo: 15,
    precoVenda: 120,
    unidadesVendidas30d: 0,
    gmv30d: 0,
    estoque: 8,
    adsStatus: "desconhecido",
  },
];

describe("product classification", () => {
  it("marks rotation champions", () => {
    expect(isRotationChampion(products[0], products)).toBe(true);
  });

  it("marks ads priority for champion with margin and inactive ads", () => {
    const classifications = classifyProduct(products[0], {
      products,
      market: [{ categoria: "Beleza", precoMedioMercado: 75, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });
    expect(classifications).toContain("campeao_de_giro");
    expect(classifications).toContain("prioridade_ads");
    expect(classifications).not.toContain("verificar_ads");
  });

  it("marks champions with UNKNOWN ads status as 'verificar_ads' (not prioridade_ads)", () => {
    const unknownAds: ProductRow = { ...products[0], adsStatus: undefined };
    const classifications = classifyProduct(unknownAds, {
      products: [unknownAds, ...products.slice(1)],
      market: [{ categoria: "Beleza", precoMedioMercado: 75, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).toContain("verificar_ads");
    expect(classifications).not.toContain("prioridade_ads");
  });

  it("treats explicit 'desconhecido' the same as a missing ads status", () => {
    const unknownAds: ProductRow = { ...products[0], adsStatus: "desconhecido" };
    const classifications = classifyProduct(unknownAds, {
      products: [unknownAds, ...products.slice(1)],
      market: [{ categoria: "Beleza", precoMedioMercado: 75, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).toContain("verificar_ads");
  });

  it("marks lucky sale and no CPC recommendation", () => {
    const classifications = classifyProduct(products[1], {
      products,
      market: [{ categoria: "Moda", precoMedioMercado: 60, precoMedioSeller: 180 }],
      averageTicket: 70,
      config,
    });
    expect(classifications).toContain("venda_por_sorte");
    expect(classifications).toContain("nao_priorizar_cpc");
  });

  it("keeps CPC priority for a high-gap champion that already proves demand", () => {
    // Gap alto sozinho não bloqueia campeão de giro: ele já vende ao preço premium.
    const classifications = classifyProduct(products[0], {
      products,
      market: [{ categoria: "Beleza", precoMedioMercado: 20, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).toContain("prioridade_ads");
    expect(classifications).not.toContain("nao_priorizar_cpc");
  });

  it("flags an inactive listing and blocks Ads priority even for a champion", () => {
    const pausedChampion: ProductRow = { ...products[0], statusAnuncio: "Pausado" };
    const classifications = classifyProduct(pausedChampion, {
      products: [pausedChampion, ...products.slice(1)],
      market: [{ categoria: "Beleza", precoMedioMercado: 75, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).toContain("anuncio_inativo");
    expect(classifications).not.toContain("prioridade_ads");
  });

  it("treats an unrecognized status as active (no false positive)", () => {
    const active: ProductRow = { ...products[0], statusAnuncio: "Ativo" };
    const classifications = classifyProduct(active, {
      products: [active, ...products.slice(1)],
      market: [{ categoria: "Beleza", precoMedioMercado: 75, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).not.toContain("anuncio_inativo");
  });

  it("blocks CPC priority when market gap is high on a low-rotation product", () => {
    const classifications = classifyProduct(products[2], {
      products,
      market: [{ categoria: "Casa", precoMedioMercado: 20, precoMedioSeller: 80 }],
      averageTicket: 70,
      config,
    });

    expect(classifications).not.toContain("prioridade_ads");
    expect(classifications).toContain("nao_priorizar_cpc");
  });
});
