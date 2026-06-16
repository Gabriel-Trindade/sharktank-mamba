import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ProductAnalysis } from "../../domain/types";

const RADAR_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

type Props = {
  data: ProductAnalysis[];
};

const shortName = (p: ProductAnalysis) =>
  p.produto.split(" ").slice(0, 2).join(" ");

const RadarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface, #1e1e2e)",
        border: "1px solid var(--color-border, #333)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}/100
        </div>
      ))}
    </div>
  );
};

export const ProductAdsRadarChart = ({ data }: Props) => {
  if (data.length === 0) return null;

  const maxUnits = Math.max(...data.map((p) => p.unidadesVendidas30d), 1);
  const maxGmv = Math.max(...data.map((p) => p.gmv30d), 1);

  const radarData = [
    {
      metric: "Giro",
      ...Object.fromEntries(
        data.map((p) => [p.sku, Math.round((p.unidadesVendidas30d / maxUnits) * 100)]),
      ),
    },
    {
      metric: "Margem",
      ...Object.fromEntries(data.map((p) => [p.sku, Math.min(100, Math.round(p.margemPct))])),
    },
    {
      metric: "Score",
      ...Object.fromEntries(data.map((p) => [p.sku, Math.min(100, p.score)])),
    },
    {
      metric: "GMV rel.",
      ...Object.fromEntries(
        data.map((p) => [p.sku, Math.round((p.gmv30d / maxGmv) * 100)]),
      ),
    },
  ];

  return (
    <div className="chart-box" aria-label="Perfil dos candidatos a Ads">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} outerRadius="70%">
          <PolarGrid stroke="var(--color-border, #333)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: "var(--color-muted, #888)" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {data.map((p, i) => (
            <Radar
              key={p.sku}
              name={shortName(p)}
              dataKey={p.sku}
              stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
              fill={RADAR_COLORS[i % RADAR_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: "0.8rem" }}>{value}</span>
            )}
          />
          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
