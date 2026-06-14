import { useMemo } from "react";
import { Badge } from "../../components/ui/Badge";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { formatCurrency, formatInteger, formatPercent } from "../../domain/formatters";
import type { ProductAnalysis, ProductClassification } from "../../domain/types";

type ProductCurveSectionProps = {
  products: ProductAnalysis[];
};

const classificationLabel: Record<ProductClassification, string> = {
  campeao_de_giro: "Campeao de giro",
  prioridade_ads: "Prioridade Ads",
  venda_por_sorte: "Venda por sorte",
  candidato_promocao: "Promocao",
  produto_isca: "Produto isca",
  nao_priorizar_cpc: "Nao CPC",
};

const classificationTone = (classification: ProductClassification): "success" | "warning" | "danger" | "info" => {
  if (classification === "prioridade_ads" || classification === "campeao_de_giro") {
    return "success";
  }

  if (classification === "nao_priorizar_cpc" || classification === "venda_por_sorte") {
    return "danger";
  }

  return "info";
};

export const ProductCurveSection = ({ products }: ProductCurveSectionProps) => {
  const sortedProducts = useMemo(() => [...products].sort((a, b) => b.score - a.score), [products]);

  const columns: DataTableColumn<ProductAnalysis>[] = [
    {
      key: "produto",
      header: "Produto",
      render: (row) => (
        <div>
          <strong>{row.produto}</strong>
          <div className="muted">{row.sku}</div>
        </div>
      ),
    },
    { key: "unidades", header: "Unidades", align: "right", render: (row) => formatInteger(row.unidadesVendidas30d) },
    { key: "gmv", header: "GMV 30d", align: "right", render: (row) => formatCurrency(row.gmv30d) },
    { key: "margem", header: "Margem", align: "right", render: (row) => formatPercent(row.margemPct) },
    { key: "ads", header: "Ads", render: (row) => <Badge>{row.adsStatus}</Badge> },
    {
      key: "classificacao",
      header: "Classificacao",
      render: (row) => (
        <div className="badge-row">
          {row.isCurveAUnits ? <Badge tone="success">Curva A giro</Badge> : null}
          {row.isCurveAGmv ? <Badge tone="warning">Curva A GMV</Badge> : null}
          {row.classifications.slice(0, 2).map((classification) => (
            <Badge key={classification} tone={classificationTone(classification)}>
              {classificationLabel[classification]}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-header">
        <h2>Curva A inteligente</h2>
        <p>GMV cruzado com giro real. GMV sozinho engana.</p>
      </div>
      <DataTable columns={columns} rows={sortedProducts} getRowKey={(row) => row.sku} />
    </section>
  );
};
