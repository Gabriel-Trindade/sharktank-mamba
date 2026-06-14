import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProductAnalysis } from "../../domain/types";

type ProductGmvChartProps = {
  data: ProductAnalysis[];
};

export const ProductGmvChart = ({ data }: ProductGmvChartProps) => (
  <div className="chart-box" aria-label="Gráfico de GMV por produto">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 8)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="sku" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="gmv30d" name="GMV" fill="var(--color-chart-a)" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
