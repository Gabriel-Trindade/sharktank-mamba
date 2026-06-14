import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketAnalysis } from "../../domain/types";

type MarketGapChartProps = {
  data: MarketAnalysis[];
};

export const MarketGapChart = ({ data }: MarketGapChartProps) => (
  <div className="chart-box" aria-label="Gráfico de mercado versus seller">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="categoria" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="precoMedioMercado" name="Mercado" fill="var(--color-chart-b)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="precoMedioSeller" name="Seller" fill="var(--color-chart-a)" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
