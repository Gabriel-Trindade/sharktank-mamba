import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProductAnalysis } from "../../domain/types";

type ProductUnitsChartProps = {
  data: ProductAnalysis[];
};

export const ProductUnitsChart = ({ data }: ProductUnitsChartProps) => (
  <div className="chart-box" aria-label="Gráfico de unidades por produto">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 8)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="sku" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="unidadesVendidas30d" name="Unidades" fill="var(--color-chart-c)" radius={[0, 0, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
