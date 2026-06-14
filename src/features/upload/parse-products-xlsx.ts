import { productRowSchema } from "../../domain/schemas";
import type { ProductRow } from "../../domain/types";

export type ParseProductsResult = {
  products: ProductRow[];
  recognizedColumns: string[];
  missingColumns: string[];
  ignoredRows: number;
  totalRows: number;
  gmvIdentified: number;
  errors: string[];
};

const requiredColumns = [
  "sku",
  "produto",
  "categoria",
  "marca",
  "custo",
  "preco_venda",
  "unidades_vendidas_30d",
  "gmv_30d",
  "estoque",
  "ads_status",
];

const optionalColumns = ["status_logistica", "status_anuncio", "url_produto", "observacao"];

const columnMap = {
  sku: "sku",
  produto: "produto",
  categoria: "categoria",
  marca: "marca",
  custo: "custo",
  preco_venda: "precoVenda",
  unidades_vendidas_30d: "unidadesVendidas30d",
  gmv_30d: "gmv30d",
  estoque: "estoque",
  ads_status: "adsStatus",
  status_logistica: "statusLogistica",
  status_anuncio: "statusAnuncio",
  url_produto: "urlProduto",
  observacao: "observacao",
} as const;

export const parseProductsXlsx = async (file: File): Promise<ParseProductsResult> => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === "produtos") ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return emptyResult(["Nenhuma aba encontrada na planilha."]);
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  const headers = (matrix[0] ?? []).map((item) => normalizeHeader(String(item)));
  const recognizedColumns = headers.filter((header) =>
    [...requiredColumns, ...optionalColumns].includes(header),
  );
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
  const errors: string[] = [];

  if (missingColumns.length > 0) {
    errors.push(`Colunas obrigatórias ausentes: ${missingColumns.join(", ")}.`);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const products: ProductRow[] = [];
  let ignoredRows = 0;

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row);
    const parsed = productRowSchema.safeParse(normalized);

    if (parsed.success) {
      products.push(parsed.data);
      return;
    }

    ignoredRows += 1;
    errors.push(`Linha ${index + 2}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}.`);
  });

  return {
    products,
    recognizedColumns,
    missingColumns,
    ignoredRows,
    totalRows: rows.length,
    gmvIdentified: products.reduce((sum, product) => sum + product.gmv30d, 0),
    errors,
  };
};

const emptyResult = (errors: string[]): ParseProductsResult => ({
  products: [],
  recognizedColumns: [],
  missingColumns: requiredColumns,
  ignoredRows: 0,
  totalRows: 0,
  gmvIdentified: 0,
  errors,
});

const normalizeRow = (row: Record<string, unknown>) => {
  const output: Record<string, unknown> = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key);
    const mappedKey = columnMap[normalizedKey as keyof typeof columnMap];

    if (!mappedKey) {
      return;
    }

    if (["custo", "precoVenda", "unidadesVendidas30d", "gmv30d", "estoque"].includes(mappedKey)) {
      output[mappedKey] = parseNumber(value);
      return;
    }

    if (mappedKey === "adsStatus") {
      output[mappedKey] = normalizeAdsStatus(value);
      return;
    }

    output[mappedKey] = String(value ?? "").trim();
  });

  return output;
};

const normalizeHeader = (header: string) =>
  header
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");

const parseNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
};

const normalizeAdsStatus = (value: unknown) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "ativo" || normalized === "inativo") {
    return normalized;
  }

  return "desconhecido";
};

export { optionalColumns, requiredColumns };
