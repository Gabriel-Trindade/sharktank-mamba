import { Card } from "../../components/ui/Card";
import { NumberInput } from "../../components/ui/NumberInput";
import type { TrafficMetrics } from "../../domain/types";

type TrafficFormProps = {
  value: TrafficMetrics;
  onChange: (value: TrafficMetrics) => void;
};

export const TrafficForm = ({ value, onChange }: TrafficFormProps) => {
  const update = (key: keyof TrafficMetrics, nextValue: number) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <Card title="Tráfego e canais" description="Informe a origem das vendas para medir dependência de Ads e apoio orgânico.">
      <div className="form-grid three">
        <NumberInput label="Vendas totais" value={value.vendasTotais} format="currency" onValueChange={(next) => update("vendasTotais", next)} required />
        <NumberInput
          label="Card do produto"
          value={value.vendasCardProduto}
          format="currency"
          onValueChange={(next) => update("vendasCardProduto", next)}
          required
        />
        <NumberInput label="Lives" value={value.vendasLives} format="currency" onValueChange={(next) => update("vendasLives", next)} required />
        <NumberInput
          label="Vídeo do vendedor"
          value={value.vendasVideoVendedor}
          format="currency"
          onValueChange={(next) => update("vendasVideoVendedor", next)}
          required
        />
        <NumberInput label="Afiliado" value={value.vendasAfiliado} format="currency" onValueChange={(next) => update("vendasAfiliado", next)} required />
        <NumberInput
          label="Shopee Ads"
          value={value.vendasShopeeAds}
          format="currency"
          onValueChange={(next) => update("vendasShopeeAds", next)}
          required
        />
      </div>
    </Card>
  );
};
