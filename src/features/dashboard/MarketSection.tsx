import { MarketGapChart } from "../../components/charts/MarketGapChart";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { formatCurrency, formatPercent } from "../../domain/formatters";
import type { MarketAnalysis } from "../../domain/types";

type MarketSectionProps = {
  market: MarketAnalysis[];
};

const columns: DataTableColumn<MarketAnalysis>[] = [
  {
    key: "categoria",
    header: "Categoria",
    render: (row) => (
      <div>
        <strong>{row.categoria}</strong>
        <div className="muted">{row.palavraChave ?? "Benchmark manual"}</div>
      </div>
    ),
  },
  { key: "mercado", header: "Mercado", align: "right", render: (row) => formatCurrency(row.precoMedioMercado) },
  { key: "seller", header: "Seller", align: "right", render: (row) => formatCurrency(row.precoMedioSeller) },
  { key: "gap", header: "Gap", align: "right", render: (row) => formatPercent(row.gapPct) },
  {
    key: "unidades",
    header: "Giro",
    align: "right",
    render: (row) => `${row.unidadesMesSeller ?? 0}/${row.unidadesMesMercado ?? 0}`,
  },
  {
    key: "status",
    header: "Leitura",
    render: (row) => (
      <div>
        <div className="badge-row">
          <Badge tone={row.highGap ? "danger" : "success"}>{row.highGap ? "Gap alto" : "Competitivo"}</Badge>
          {row.lowLiquidity ? <Badge tone="warning">Baixa liquidez</Badge> : null}
        </div>
        <div className="muted">{row.reading}</div>
      </div>
    ),
  },
];

export const MarketSection = ({ market }: MarketSectionProps) => (
  <div className="section-stack">
    <Card title="Mercado versus seller" description="Comparação de preço médio por categoria.">
      <MarketGapChart data={market} />
    </Card>
    <Card title="Gaps de mercado">
      <DataTable columns={columns} rows={market} getRowKey={(row) => row.categoria} />
    </Card>
  </div>
);
