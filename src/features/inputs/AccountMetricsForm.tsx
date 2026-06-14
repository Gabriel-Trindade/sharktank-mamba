import { Card } from "../../components/ui/Card";
import { NumberInput } from "../../components/ui/NumberInput";
import type { AccountMetrics } from "../../domain/types";

type AccountMetricsFormProps = {
  value: AccountMetrics;
  onChange: (value: AccountMetrics) => void;
};

export const AccountMetricsForm = ({ value, onChange }: AccountMetricsFormProps) => {
  const update = (key: keyof AccountMetrics, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <Card title="Métricas da conta" description="Use os números dos últimos 30 dias e do período anterior comparável.">
      <div className="form-grid three">
        <NumberInput label="Vendas 30d" value={value.vendas30d} format="currency" onValueChange={(next) => update("vendas30d", next)} required />
        <NumberInput
          label="Vendas período anterior"
          value={value.vendasPeriodoAnterior}
          format="currency"
          onValueChange={(next) => update("vendasPeriodoAnterior", next)}
          required
        />
        <NumberInput
          label="Vendas sem desconto"
          value={value.vendasSemDesconto ?? 0}
          format="currency"
          onValueChange={(next) => update("vendasSemDesconto", next)}
        />
        <NumberInput label="Pedidos 30d" value={value.pedidos30d} onValueChange={(next) => update("pedidos30d", next)} required />
        <NumberInput
          label="Pedidos período anterior"
          value={value.pedidosPeriodoAnterior}
          onValueChange={(next) => update("pedidosPeriodoAnterior", next)}
          required
        />
        <NumberInput
          label="Cancelamentos 30d"
          value={value.cancelamentos30d}
          onValueChange={(next) => update("cancelamentos30d", next)}
          required
        />
        <NumberInput
          label="Cancelamentos anteriores"
          value={value.cancelamentosPeriodoAnterior}
          onValueChange={(next) => update("cancelamentosPeriodoAnterior", next)}
          required
        />
        <NumberInput label="Visitantes" value={value.visitantes} onValueChange={(next) => update("visitantes", next)} required />
        <NumberInput label="Compradores" value={value.compradores} onValueChange={(next) => update("compradores", next)} required />
      </div>
    </Card>
  );
};

