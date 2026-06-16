import clsx from "clsx";
import { useMemo, useState } from "react";
import { ProductAdsRadarChart } from "../../components/charts/ProductAdsRadarChart";
import { ProductDistributionPieChart } from "../../components/charts/ProductDistributionPieChart";
import { ProductGiroBarChart } from "../../components/charts/ProductGiroBarChart";
import { ProductGmvChart } from "../../components/charts/ProductGmvChart";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { formatCurrency, formatInteger, formatPercent } from "../../domain/formatters";
import type { ProductAnalysis, ProductClassification } from "../../domain/types";

type ProductFilter = "all" | "curva_a" | "prioridade_ads" | "atencao";

const filterOptions: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "curva_a", label: "Curva A" },
  { value: "prioridade_ads", label: "Prioridade Ads" },
  { value: "atencao", label: "Atenção" },
];

const filterDescription: Record<ProductFilter, string> = {
  all: "Todos os produtos ordenados por score de oportunidade.",
  curva_a: "Produtos que concentram ~80% do GMV ou do giro em unidades — a base real da operação.",
  prioridade_ads:
    "Campeões de giro com margem positiva e Ads inativo. Candidatos ao próximo teste de campanha controlada.",
  atencao:
    "Produtos que precisam de ajuste orgânico (giro, preço, prova social) antes de receber verba paga.",
};

const chartMeta: Record<ProductFilter, { title: string; description: string }> = {
  all: {
    title: "Distribuição de GMV",
    description: "Participação de cada produto no faturamento total — Curva A em destaque.",
  },
  curva_a: {
    title: "GMV 30d — Curva A",
    description: "Faturamento absoluto dos produtos que concentram ~80% da receita.",
  },
  prioridade_ads: {
    title: "Perfil dos candidatos a Ads",
    description: "Giro, margem, score e GMV normalizados (0–100) para comparação entre candidatos.",
  },
  atencao: {
    title: "Giro por produto",
    description: "Unidades vendidas vs. mediana geral do catálogo. Produtos abaixo da linha precisam de ajuste orgânico antes de Ads.",
  },
};

type ProductCurveSectionProps = {
  products: ProductAnalysis[];
};

const classificationLabel: Record<ProductClassification, string> = {
  campeao_de_giro: "Campeão de Giro",
  prioridade_ads: "Prioridade Ads",
  venda_por_sorte: "Venda por Sorte",
  candidato_promocao: "Promoção",
  produto_isca: "Produto Isca",
  nao_priorizar_cpc: "Aguardar Ads",
};

const classificationTone = (classification: ProductClassification): "success" | "warning" | "danger" | "info" => {
  if (classification === "prioridade_ads" || classification === "campeao_de_giro") return "success";
  if (classification === "venda_por_sorte") return "danger";
  if (classification === "nao_priorizar_cpc") return "warning";
  return "info";
};

const GENERIC_READING = "Produto elegível para acompanhamento no plano de recuperação.";

const computeMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const ProductCurveSection = ({ products }: ProductCurveSectionProps) => {
  const [filter, setFilter] = useState<ProductFilter>("all");

  const medianUnits = useMemo(
    () => computeMedian(products.map((p) => p.unidadesVendidas30d)),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => b.score - a.score);
    switch (filter) {
      case "curva_a":
        return sorted.filter((p) => p.isCurveAUnits || p.isCurveAGmv);
      case "prioridade_ads":
        return sorted.filter((p) => p.classifications.includes("prioridade_ads"));
      case "atencao":
        return sorted.filter(
          (p) =>
            p.classifications.includes("nao_priorizar_cpc") ||
            p.classifications.includes("venda_por_sorte"),
        );
      default:
        return sorted;
    }
  }, [products, filter]);

  const columns: DataTableColumn<ProductAnalysis>[] = [
    {
      key: "produto",
      header: "Produto",
      render: (row) => (
        <div>
          <strong>{row.produto}</strong>
          <div className="muted">{row.sku}</div>
          {row.reading !== GENERIC_READING && (
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              {row.reading}
            </div>
          )}
        </div>
      ),
    },
    { key: "unidades", header: "Unidades", align: "right", render: (row) => formatInteger(row.unidadesVendidas30d) },
    { key: "gmv", header: "GMV 30d", align: "right", render: (row) => formatCurrency(row.gmv30d) },
    { key: "margem", header: "Margem", align: "right", render: (row) => formatPercent(row.margemPct) },
    { key: "ads", header: "Ads", render: (row) => <Badge>{row.adsStatus}</Badge> },
    {
      key: "classificacao",
      header: "Classificação",
      render: (row) => (
        <div className="badge-row">
          {row.isCurveAUnits ? (
            <Badge tone="success" title="Representa ~80% das unidades vendidas do período">
              Curva A Giro
            </Badge>
          ) : null}
          {row.isCurveAGmv ? (
            <Badge tone="info" title="Representa ~80% do faturamento do período">
              Curva A GMV
            </Badge>
          ) : null}
          {row.classifications.slice(0, 2).map((classification) => (
            <Badge key={classification} tone={classificationTone(classification)}>
              {classificationLabel[classification]}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  const meta = chartMeta[filter];

  const renderChart = () => {
    switch (filter) {
      case "all":
        return <ProductDistributionPieChart data={filteredProducts} />;
      case "curva_a":
        return <ProductGmvChart data={filteredProducts} />;
      case "prioridade_ads":
        return <ProductAdsRadarChart data={filteredProducts} />;
      case "atencao":
        return <ProductGiroBarChart data={filteredProducts} medianUnits={medianUnits} />;
    }
  };

  return (
    <div className="section-stack">
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Curva A inteligente</h2>
          <p>
            Os badges <strong>Curva A Giro</strong> e <strong>Curva A GMV</strong> marcam os produtos que,
            sozinhos, concentram ~80% das unidades vendidas e do faturamento do período. GMV sozinho engana — um
            produto com alto faturamento mas baixo giro pode ser venda por sorte.
          </p>
        </div>
        <div className="tabs">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={clsx("tab-button", filter === opt.value && "is-active")}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          {filterDescription[filter]}
        </p>
      </section>

      <Card title={meta.title} description={meta.description}>
        {renderChart()}
      </Card>

      <section className="dashboard-section">
        {filteredProducts.length > 0 ? (
          <DataTable columns={columns} rows={filteredProducts} getRowKey={(row) => row.sku} />
        ) : (
          <p className="muted">Nenhum produto corresponde ao filtro selecionado.</p>
        )}
      </section>
    </div>
  );
};
