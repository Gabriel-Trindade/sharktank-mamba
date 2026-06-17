import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { fetchShopeeMarketBenchmark } from "../../services/geckoApi";
import type { MarketBenchmark } from "../../domain/types";
import type { GeckoBenchmarkStatus, MarketBenchmarkFromGecko } from "../../domain/market/geckoTypes";

type GeckoBenchmarkButtonProps = {
  keyword?: string;
  onApply: (patch: Partial<MarketBenchmark>) => void;
  onInsight: (insight: MarketBenchmarkFromGecko) => void;
};

const LOADING_MESSAGE = "Consultando mercado na Shopee...";

export const GeckoBenchmarkButton = ({ keyword, onApply, onInsight }: GeckoBenchmarkButtonProps) => {
  const [status, setStatus] = useState<GeckoBenchmarkStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const trimmedKeyword = keyword?.trim() ?? "";

  const handleSearch = async () => {
    if (!trimmedKeyword) {
      setStatus("error");
      setMessage("Informe uma palavra-chave para buscar o benchmark na Shopee.");
      return;
    }

    setStatus("loading");
    setMessage(LOADING_MESSAGE);

    const outcome = await fetchShopeeMarketBenchmark(trimmedKeyword);

    if (!outcome.ok) {
      setStatus(outcome.error.shouldUseFallback ? "fallback" : "error");
      setMessage(outcome.error.message);
      return;
    }

    const { benchmark } = outcome;
    const marketPrice = benchmark.marketMedianPrice ?? benchmark.marketAveragePrice;

    // Preenche apenas dados de mercado — nunca sobrescreve preço/unidades do seller.
    const patch: Partial<MarketBenchmark> = { fonte: benchmark.source };
    if (marketPrice !== null) {
      patch.precoMedioMercado = marketPrice;
    }
    if (benchmark.marketMinPrice !== null) {
      patch.precoMinMercado = benchmark.marketMinPrice;
    }
    if (benchmark.marketMaxPrice !== null) {
      patch.precoMaxMercado = benchmark.marketMaxPrice;
    }

    onApply(patch);
    onInsight(benchmark);
    setSource(benchmark.source);
    setStatus("success");
    setMessage(`${benchmark.itemsAnalyzed} produtos analisados na Shopee.`);
  };

  return (
    <div className="gecko-benchmark">
      <Button
        variant="primary"
        size="sm"
        icon={status === "loading" ? <Loader2 size={16} className="gecko-spin" /> : <Search size={16} />}
        onClick={handleSearch}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Buscando..." : "Consultar Dados de Mercado"}
      </Button>

      {status === "loading" ? <span className="gecko-status-text muted">{LOADING_MESSAGE}</span> : null}

      {status === "success" ? (
        <span className="gecko-status-text">
          <Badge tone="success">
            <CheckCircle2 size={12} /> Fonte: {source}
          </Badge>
          <span className="muted">{message}</span>
        </span>
      ) : null}

      {status === "fallback" ? (
        <span className="gecko-status-text">
          <Badge tone="warning">Usando benchmark estático</Badge>
          <span className="muted">{message}</span>
        </span>
      ) : null}

      {status === "error" ? (
        <span className="gecko-status-text gecko-status-error">
          <AlertCircle size={14} /> {message}
        </span>
      ) : null}
    </div>
  );
};
