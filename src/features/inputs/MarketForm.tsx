import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { NumberInput } from "../../components/ui/NumberInput";
import type { MarketBenchmark } from "../../domain/types";

type MarketFormProps = {
  value: MarketBenchmark[];
  onChange: (value: MarketBenchmark[]) => void;
};

const emptyBenchmark = (): MarketBenchmark => ({
  categoria: "",
  palavraChave: "",
  precoMedioMercado: 0,
  precoMedioSeller: 0,
  unidadesMesMercado: 0,
  unidadesMesSeller: 0,
  fonte: "Manual",
});

export const MarketForm = ({ value, onChange }: MarketFormProps) => {
  const update = (index: number, patch: Partial<MarketBenchmark>) => {
    onChange(value.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <Card
      title="Mercado"
      description="Informe benchmarks por categoria para calcular gap de preço e leitura competitiva."
      actions={
        <Button icon={<Plus size={16} />} onClick={() => onChange([...value, emptyBenchmark()])}>
          Adicionar
        </Button>
      }
    >
      <div className="market-form-list">
        {value.map((item, index) => (
          <div className="market-row" key={`${item.categoria}-${index}`}>
            <div className="form-grid three">
              <Input
                label="Categoria"
                value={item.categoria}
                onChange={(event) => update(index, { categoria: event.target.value })}
                required
              />
              <Input
                label="Palavra-chave"
                value={item.palavraChave ?? ""}
                onChange={(event) => update(index, { palavraChave: event.target.value })}
              />
              <Input
                label="Fonte"
                value={item.fonte ?? ""}
                onChange={(event) => update(index, { fonte: event.target.value })}
              />
              <NumberInput
                label="Preço médio mercado"
                value={item.precoMedioMercado}
                format="currency"
                onValueChange={(next) => update(index, { precoMedioMercado: next })}
                required
              />
              <NumberInput
                label="Preço médio seller"
                value={item.precoMedioSeller}
                format="currency"
                onValueChange={(next) => update(index, { precoMedioSeller: next })}
                required
              />
              <NumberInput
                label="Unidades mês mercado"
                value={item.unidadesMesMercado ?? 0}
                onValueChange={(next) => update(index, { unidadesMesMercado: next })}
              />
              <NumberInput
                label="Unidades mês seller"
                value={item.unidadesMesSeller ?? 0}
                onValueChange={(next) => update(index, { unidadesMesSeller: next })}
              />
              <Button
                className="self-end"
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
