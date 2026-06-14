import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AccountMetrics } from "../../domain/types";

type TrendLineChartProps = {
  account: AccountMetrics;
};

export const TrendLineChart = ({ account }: TrendLineChartProps) => {
  const data = [
    {
      periodo: "Anterior",
      vendas: account.vendasPeriodoAnterior,
      pedidos: account.pedidosPeriodoAnterior,
      visitantes: account.visitantes,
    },
    {
      periodo: "Atual",
      vendas: account.vendas30d,
      pedidos: account.pedidos30d,
      visitantes: account.visitantes,
    },
  ];

  return (
    <div className="chart-box" aria-label="Linha de vendas e visitantes">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="vendas" stroke="var(--color-chart-a)" strokeWidth={3} />
          <Line type="monotone" dataKey="visitantes" stroke="var(--color-chart-b)" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
