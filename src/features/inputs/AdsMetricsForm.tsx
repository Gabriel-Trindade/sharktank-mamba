import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { NumberInput } from "../../components/ui/NumberInput";
import type { AdsMetrics } from "../../domain/types";

type AdsMetricsFormProps = {
  value: AdsMetrics;
  onChange: (value: AdsMetrics) => void;
};

export const AdsMetricsForm = ({ value, onChange }: AdsMetricsFormProps) => {
  const update = (key: keyof AdsMetrics, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };
  const updateOptional = (key: "ctr" | "roas", nextValue: string) => {
    const parsed = Number(nextValue);
    onChange({ ...value, [key]: nextValue.trim() === "" || !Number.isFinite(parsed) ? undefined : parsed });
  };

  return (
    <Card title="Shopee Ads" description="CTR e ROAS podem ficar em branco; o motor calcula a partir dos dados brutos.">
      <div className="form-grid three">
        <NumberInput label="Impressões" value={value.impressoes} onValueChange={(next) => update("impressoes", next)} required />
        <NumberInput label="Cliques" value={value.cliques} onValueChange={(next) => update("cliques", next)} required />
        <Input
          label="CTR informado (%)"
          type="number"
          min={0}
          step="0.01"
          value={value.ctr ?? ""}
          onChange={(event) => updateOptional("ctr", event.target.value)}
        />
        <NumberInput label="Pedidos Ads" value={value.pedidosAds} onValueChange={(next) => update("pedidosAds", next)} required />
        <NumberInput
          label="Itens vendidos Ads"
          value={value.itensVendidosAds}
          onValueChange={(next) => update("itensVendidosAds", next)}
          required
        />
        <NumberInput
          label="Vendas Ads"
          value={value.vendasAds}
          format="currency"
          onValueChange={(next) => update("vendasAds", next)}
          required
        />
        <NumberInput
          label="Investimento Ads"
          value={value.investimentoAds}
          format="currency"
          onValueChange={(next) => update("investimentoAds", next)}
          required
        />
        <Input
          label="ROAS informado"
          type="number"
          min={0}
          step="0.01"
          value={value.roas ?? ""}
          onChange={(event) => updateOptional("roas", event.target.value)}
        />
      </div>
    </Card>
  );
};
