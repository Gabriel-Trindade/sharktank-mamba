import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { optionalColumns, parseProductsXlsx, requiredColumns } from "./parse-products-xlsx";

// Constrói um File "falso" a partir de linhas, sem depender de File/Blob do ambiente:
// o parser só chama file.arrayBuffer(), então fornecemos exatamente isso.
const fakeXlsxFile = (rows: Record<string, unknown>[]): File => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "produtos");
  const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  return { arrayBuffer: async () => data } as unknown as File;
};

// Linha no formato do export real "Top Produtos Curva A": sem ads_status e sem estoque.
const curveAExportRow = {
  sku: "01",
  produto: "Conjunto Colar e Brinco Gota Zircônia",
  categoria: "Conjuntos e Pacotes de Acessórios",
  marca: "Própria",
  custo: 75,
  preco_venda: 145,
  unidades_vendidas_30d: 15,
  gmv_30d: 2175,
};

describe("parseProductsXlsx column requirements", () => {
  it("treats ads_status and estoque as optional, not required", () => {
    expect(requiredColumns).not.toContain("ads_status");
    expect(requiredColumns).not.toContain("estoque");
    expect(optionalColumns).toContain("ads_status");
    expect(optionalColumns).toContain("estoque");
  });

  it("parses a Curve A export without ads_status/estoque (no missing-column error)", async () => {
    const result = await parseProductsXlsx(fakeXlsxFile([curveAExportRow]));

    expect(result.products).toHaveLength(1);
    expect(result.missingColumns).not.toContain("ads_status");
    expect(result.missingColumns).not.toContain("estoque");
    expect(result.errors).toHaveLength(0);
    // Sem a coluna, o status fica indefinido → o diagnóstico cai no modo verificar.
    expect(result.products[0].adsStatus).toBeUndefined();
  });

  it("uses the ads_status column when the seller provides it", async () => {
    const result = await parseProductsXlsx(
      fakeXlsxFile([{ ...curveAExportRow, ads_status: "ativo" }]),
    );

    expect(result.products[0].adsStatus).toBe("ativo");
  });
});
