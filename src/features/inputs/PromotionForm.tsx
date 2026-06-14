import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { NumberInput } from "../../components/ui/NumberInput";
import type { PromotionMetrics } from "../../domain/types";

type PromotionFormProps = {
  value: PromotionMetrics;
  onChange: (value: PromotionMetrics) => void;
};

export const PromotionForm = ({ value, onChange }: PromotionFormProps) => {
  const updateNumber = (key: keyof PromotionMetrics, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <Card title="Promoções" description="Defina a promoção ativa e o teto de desconto permitido pela margem.">
      <div className="form-grid three">
        <Input label="Nome da promoção" value={value.nome} onChange={(event) => onChange({ ...value, nome: event.target.value })} required />
        <label className="field">
          <span className="field-label">Tipo de desconto</span>
          <select
            className="field-input"
            value={value.tipoDesconto}
            onChange={(event) =>
              onChange({
                ...value,
                tipoDesconto: event.target.value === "valor_fixo" ? "valor_fixo" : "percentual",
              })
            }
          >
            <option value="percentual">Percentual</option>
            <option value="valor_fixo">Valor fixo</option>
          </select>
        </label>
        <NumberInput
          label="Desconto atual (%)"
          value={value.descontoAtualPct}
          onValueChange={(next) => updateNumber("descontoAtualPct", next)}
          required
        />
        <NumberInput
          label="Desconto máximo (%)"
          value={value.descontoMaximoPct}
          onValueChange={(next) => updateNumber("descontoMaximoPct", next)}
          required
        />
        <NumberInput
          label="Vendas promoção"
          value={value.vendasPromocao}
          format="currency"
          onValueChange={(next) => updateNumber("vendasPromocao", next)}
          required
        />
        <NumberInput
          label="Unidades promoção"
          value={value.unidadesVendidasPromocao}
          onValueChange={(next) => updateNumber("unidadesVendidasPromocao", next)}
          required
        />
        <NumberInput
          label="Pedidos promoção"
          value={value.pedidosPromocao}
          onValueChange={(next) => updateNumber("pedidosPromocao", next)}
          required
        />
        <NumberInput
          label="Compradores promoção"
          value={value.compradoresPromocao}
          onValueChange={(next) => updateNumber("compradoresPromocao", next)}
          required
        />
      </div>
    </Card>
  );
};
