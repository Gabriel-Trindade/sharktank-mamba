import { optionalColumns, requiredColumns } from "./parse-products-xlsx";

const productTemplateHeaders = [...requiredColumns, ...optionalColumns];
const productTemplateFileName = "modelo-produtos-seller-recovery.xlsx";

const productTemplateRows = [
  {
    sku: "BRI-ARG-18K",
    produto: "Brinco argola banho ouro 18k",
    categoria: "Brincos",
    marca: "Mamba Joias",
    custo: 42,
    preco_venda: 119.9,
    unidades_vendidas_30d: 24,
    gmv_30d: 2877.6,
    estoque: 80,
    ads_status: "inativo",
    status_logistica: "FULL disponível",
    status_anuncio: "ativo",
    url_produto: "https://exemplo.com/brinco-argola",
    observacao: "Campeão de giro sem Ads ativo",
  },
  {
    sku: "ANE-SOL-ZIR",
    produto: "Anel solitário zircônia premium",
    categoria: "Anéis",
    marca: "Mamba Joias",
    custo: 58,
    preco_venda: 149.9,
    unidades_vendidas_30d: 18,
    gmv_30d: 2698.2,
    estoque: 45,
    ads_status: "ativo",
    status_logistica: "envio padrão",
    status_anuncio: "ativo",
    url_produto: "https://exemplo.com/anel-solitario",
    observacao: "Produto premium acima do mercado",
  },
  {
    sku: "COL-PED-NAT",
    produto: "Colar premium pedra natural",
    categoria: "Colares",
    marca: "Mamba Joias",
    custo: 82,
    preco_venda: 204.83,
    unidades_vendidas_30d: 1,
    gmv_30d: 204.83,
    estoque: 10,
    ads_status: "inativo",
    status_logistica: "envio padrão",
    status_anuncio: "ativo",
    url_produto: "https://exemplo.com/colar-pedra-natural",
    observacao: "Venda por sorte antes de escalar CPC",
  },
];

const instructions = [
  ["Como usar", "Preencha a aba produtos e mantenha os nomes das colunas."],
  ["Período", "Use dados dos últimos 30 dias para unidades, GMV e estoque atual."],
  ["Ads", "Coluna ads_status é opcional. Use ativo ou inativo se souber; se deixar em branco, o produto entra como 'a verificar' (sem afirmar que há campanha)."],
  ["Opcional", `As colunas opcionais são: ${optionalColumns.join(", ")}.`],
];

export const downloadProductsTemplate = async () => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const productsSheet = XLSX.utils.json_to_sheet(productTemplateRows, {
    header: productTemplateHeaders,
  });
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);

  XLSX.utils.book_append_sheet(workbook, productsSheet, "produtos");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "instruções");
  XLSX.writeFile(workbook, productTemplateFileName);
};

export { productTemplateFileName, productTemplateHeaders };
