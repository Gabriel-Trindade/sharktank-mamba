import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../domain/formatters";
import type { ProductAnalysis } from "../../domain/types";

const SLICE_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c084fc",
  "#e879f9", "#f472b6", "#fb923c", "#fbbf24",
  "#a3e635", "#34d399", "#22d3ee", "#60a5fa",
  "#94a3b8",
];

type Props = {
  data: ProductAnalysis[];
};

const shortName = (nome: string) => nome.split(" ").slice(0, 3).join(" ");

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--color-surface, #1e1e2e)",
        border: "1px solid var(--color-border, #333)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.fullName}</div>
      <div style={{ color: "var(--color-muted, #888)" }}>
        {formatCurrency(item.value)} · {item.pct.toFixed(1)}% do GMV
      </div>
    </div>
  );
};

const renderSliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {pct.toFixed(0)}%
    </text>
  );
};

export const ProductDistributionPieChart = ({ data }: Props) => {
  const total = data.reduce((sum, p) => sum + p.gmv30d, 0);

  const pieData = data.map((p) => ({
    name: shortName(p.produto),
    fullName: p.produto,
    value: p.gmv30d,
    pct: total > 0 ? (p.gmv30d / total) * 100 : 0,
    sku: p.sku,
    isCurveA: p.isCurveAGmv || p.isCurveAUnits,
  }));

  return (
    <div className="pie-chart-wrapper" aria-label="Distribuição de GMV por produto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="44%"
            outerRadius="70%"
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderSliceLabel}
            strokeWidth={0}
          >
            {pieData.map((entry, i) => (
              <Cell
                key={entry.sku}
                fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                opacity={entry.isCurveA ? 1 : 0.5}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="pie-legend">
        {pieData.map((entry, i) => (
          <div key={entry.sku} className="pie-legend-item" title={entry.fullName}>
            <span
              className="pie-legend-dot"
              style={{
                background: SLICE_COLORS[i % SLICE_COLORS.length],
                opacity: entry.isCurveA ? 1 : 0.5,
              }}
            />
            <span className="pie-legend-label">{entry.name}</span>
            <span className="pie-legend-pct">{entry.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
