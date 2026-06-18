import { normalizeGeckoShopeePlp } from "../domain/market/normalizeGeckoShopeePlp";
import type {
  FetchBenchmarkOutcome,
  GeckoCreditsResponse,
  GeckoErrorInfo,
  GeckoErrorType,
  GeckoShopeePlpResponse,
  MarketBenchmarkFromGecko,
} from "../domain/market/geckoTypes";
import { buildGeckoShopeePlpMock } from "../mocks/geckoShopeePlpMock";

const ENABLED = import.meta.env.VITE_GECKO_API_ENABLED === "true";
const API_KEY = (import.meta.env.VITE_GECKO_API_KEY ?? import.meta.env.VITE_GECKO_API_KEY_FALLBACK ?? "").trim();
const BASE_URL = (import.meta.env.VITE_GECKO_API_BASE_URL ?? "https://api.geckoapi.com.br").replace(/\/$/, "");
const MOCK_MODE = import.meta.env.VITE_GECKO_API_MOCK_MODE === "true";

// A chamada pode levar até ~1 min (doc). Timeout folgado para não cortar cedo.
const EXTRACT_TIMEOUT_MS = 75_000;
const CREDITS_TIMEOUT_MS = 10_000;
const CREDIT_COST = 25;

const LIVE_SOURCE = "GeckoAPI / Shopee PLP";
const MOCK_SOURCE = "GeckoAPI Mock / Shopee PLP";

// Cache simples por keyword normalizada, só para a apresentação (evita gastar
// 25 créditos repetindo a mesma busca). Não é persistência de negócio.
const CACHE_PREFIX = "gecko-shopee-plp:";
const CACHE_TTL_MS = 20 * 60 * 1000;

const ERROR_MESSAGES: Record<GeckoErrorType, string> = {
  disabled: "Integração GeckoAPI desativada. Usando benchmark estático.",
  missing_key: "Chave da GeckoAPI não configurada. Usando benchmark estático.",
  unauthorized: "Chave da GeckoAPI inválida ou ausente. Usando benchmark estático.",
  insufficient_credits: "Créditos insuficientes na GeckoAPI. Usando benchmark estático salvo para a apresentação.",
  rate_limit: "Limite de chamadas da GeckoAPI atingido. Usando benchmark estático.",
  timeout: "A consulta demorou mais que o esperado. Usando benchmark estático.",
  not_found: "Nenhum dado encontrado para esta palavra-chave. Usando benchmark estático.",
  server_error: "Falha temporária na GeckoAPI. Usando benchmark estático.",
  unknown: "Não foi possível consultar a GeckoAPI. Usando benchmark estático.",
};

class GeckoHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`GeckoAPI HTTP ${status}`);
    this.name = "GeckoHttpError";
    this.status = status;
  }
}

const errorInfo = (type: GeckoErrorType): GeckoErrorInfo => ({
  type,
  message: ERROR_MESSAGES[type],
  shouldUseFallback: true,
});

const httpStatusToType = (status: number): GeckoErrorType => {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 402) return "insufficient_credits";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server_error";
  return "unknown";
};

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError";

export const mapGeckoError = (error: unknown): GeckoErrorInfo => {
  if (error instanceof GeckoHttpError) {
    return errorInfo(httpStatusToType(error.status));
  }

  if (isAbortError(error)) {
    return errorInfo("timeout");
  }

  return errorInfo("unknown");
};

const normalizeKeyword = (keyword: string) => keyword.trim().toLowerCase().replace(/\s+/g, " ");

type CachePayload = {
  ts: number;
  benchmark: MarketBenchmarkFromGecko;
};

const readCache = (normalizedKeyword: string): MarketBenchmarkFromGecko | null => {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${normalizedKeyword}`);
    if (!raw) return null;

    const payload = JSON.parse(raw) as CachePayload;
    if (!payload?.ts || Date.now() - payload.ts > CACHE_TTL_MS) {
      return null;
    }

    return payload.benchmark;
  } catch {
    return null;
  }
};

const writeCache = (normalizedKeyword: string, benchmark: MarketBenchmarkFromGecko) => {
  try {
    const payload: CachePayload = { ts: Date.now(), benchmark };
    sessionStorage.setItem(`${CACHE_PREFIX}${normalizedKeyword}`, JSON.stringify(payload));
  } catch {
    // Cache é só conveniência; nunca bloquear o fluxo se o storage falhar.
  }
};

const withTimeout = async <T>(timeoutMs: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Consulta de créditos (GET /v1/me/credits). Best-effort: nunca lança, nunca
 * bloqueia. Retorna null se não der para saber o saldo.
 */
export const fetchCredits = async (): Promise<number | null> => {
  if (!ENABLED || !API_KEY) {
    return null;
  }

  try {
    return await withTimeout(CREDITS_TIMEOUT_MS, async (signal) => {
      const response = await fetch(`${BASE_URL}/v1/me/credits`, {
        method: "GET",
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as GeckoCreditsResponse;
      return typeof data.currentCredits === "number" ? data.currentCredits : null;
    });
  } catch {
    return null;
  }
};

const postExtract = (keyword: string): Promise<GeckoShopeePlpResponse> =>
  withTimeout(EXTRACT_TIMEOUT_MS, async (signal) => {
    const response = await fetch(`${BASE_URL}/v1/extract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword, target: "shopee.com.br", type: "plp" }),
      signal,
    });

    if (!response.ok) {
      throw new GeckoHttpError(response.status);
    }

    return (await response.json()) as GeckoShopeePlpResponse;
  });

/**
 * Busca o benchmark de mercado na Shopee via GeckoAPI a partir de uma keyword.
 *
 * Prioridade de dados:
 *   1. cache de sessão (mesma keyword recente)
 *   2. mock enriquecido (VITE_GECKO_API_MOCK_MODE=true)
 *   3. GeckoAPI real (habilitada + chave + créditos)
 *
 * Nunca lança: qualquer falha retorna { ok:false, error } com shouldUseFallback,
 * para a UI manter o benchmark estático existente.
 */
export const fetchShopeeMarketBenchmark = async (keyword: string): Promise<FetchBenchmarkOutcome> => {
  const normalized = normalizeKeyword(keyword);

  if (!normalized) {
    return { ok: false, error: errorInfo("not_found") };
  }

  const cached = readCache(normalized);
  if (cached) {
    return { ok: true, benchmark: cached, source: "cache" };
  }

  if (MOCK_MODE) {
    const benchmark = normalizeGeckoShopeePlp(buildGeckoShopeePlpMock(keyword.trim()), keyword.trim(), MOCK_SOURCE);
    writeCache(normalized, benchmark);
    return { ok: true, benchmark, source: "mock" };
  }

  if (!ENABLED) {
    return { ok: false, error: errorInfo("disabled") };
  }

  if (!API_KEY) {
    return { ok: false, error: errorInfo("missing_key") };
  }

  // Pré-check de créditos: a chamada principal custa 25 créditos e é lenta.
  // Se já sabemos que não há saldo, evitamos a espera e caímos no fallback.
  const credits = await fetchCredits();
  if (credits !== null && credits < CREDIT_COST) {
    return { ok: false, error: errorInfo("insufficient_credits") };
  }

  try {
    const response = await postExtract(keyword.trim());

    if (response.notFound || !response.data || !(response.data.items?.length ?? 0)) {
      return { ok: false, error: errorInfo("not_found") };
    }

    const benchmark = normalizeGeckoShopeePlp(response, keyword.trim(), LIVE_SOURCE);

    if (benchmark.itemsAnalyzed === 0) {
      return { ok: false, error: errorInfo("not_found") };
    }

    writeCache(normalized, benchmark);
    return { ok: true, benchmark, source: "live" };
  } catch (error) {
    return { ok: false, error: mapGeckoError(error) };
  }
};

// Exposto para a UI poder dar dicas em dev (ex.: helper discreto quando sem chave).
export const geckoConfig = {
  enabled: ENABLED,
  hasKey: API_KEY.length > 0,
  mockMode: MOCK_MODE,
};
