import { Card } from "../../components/ui/Card";
import { NumberInput } from "../../components/ui/NumberInput";
import type { ScenarioConfig } from "../../domain/types";

type ScenarioConfigFormProps = {
  value: ScenarioConfig;
  onChange: (value: ScenarioConfig) => void;
};

export const ScenarioConfigForm = ({ value, onChange }: ScenarioConfigFormProps) => {
  const updateNumber = (key: keyof ScenarioConfig, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <Card title="Configuração do cenário" description="Use limites conservadores para score, TACOS e plano de recuperação.">
      <div className="form-grid three">
        <NumberInput
          label="Meta de faturamento"
          value={value.metaFaturamento}
          format="currency"
          onValueChange={(next) => updateNumber("metaFaturamento", next)}
          required
        />
        <NumberInput
          label="Margem de contribuição (%)"
          value={value.margemContribuicaoPct}
          onValueChange={(next) => updateNumber("margemContribuicaoPct", next)}
          required
        />
        <NumberInput
          label="TACOS máximo (%)"
          value={value.tacosMaximoPct}
          onValueChange={(next) => updateNumber("tacosMaximoPct", next)}
          required
        />
        <NumberInput
          label="Desconto máximo (%)"
          value={value.descontoMaximoPct}
          onValueChange={(next) => updateNumber("descontoMaximoPct", next)}
          required
        />
        <NumberInput
          label="Desconto atual (%)"
          value={value.descontoAtualPct}
          onValueChange={(next) => updateNumber("descontoAtualPct", next)}
          required
        />
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={value.shopeeFullLiberado}
            onChange={(event) => onChange({ ...value, shopeeFullLiberado: event.target.checked })}
          />
          <span>Shopee FULL liberado</span>
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={value.shopeeFullEmUso}
            onChange={(event) => onChange({ ...value, shopeeFullEmUso: event.target.checked })}
          />
          <span>Shopee FULL em uso</span>
        </label>
      </div>
    </Card>
  );
};
