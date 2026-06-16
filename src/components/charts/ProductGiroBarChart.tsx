import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProductAnalysis } from "../../domain/types";

type Props = {
  data: ProductAnalysis[];
  medianUnits: number;
};

export const ProductGiroBarChart = ({ data, medianUnits }: Props) => (
  <div className="chart-box" aria-label="Giro por produto com mediana do catálogo">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data.slice(0, 10)} margin={{ top: 8, right: 56, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #333)" />
        <XAxis
          dataKey="sku"
          tick={{ fontSize: 11, fill: "var(--color-muted, #888)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--color-muted, #888)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: any) => [`${value} un.`, "Giro"]}
          labelFormatter={(label) => `SKU: ${label}`}
          contentStyle={{
            background: "var(--color-surface, #1e1e2e)",
            border: "1px solid var(--color-border, #333)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar
          dataKey="unidadesVendidas30d"
          name="Unidades"
          fill="#fb923c"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
        <ReferenceLine
          y={medianUnits}
          stroke="#60a5fa"
          strokeDasharray="6 3"
          strokeWidth={2}
        >
          <Label
            value={`Mediana: ${medianUnits} un.`}
            position="insideTopRight"
            fill="#60a5fa"
            fontSize={11}
            fontWeight={600}
          />
        </ReferenceLine>
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
