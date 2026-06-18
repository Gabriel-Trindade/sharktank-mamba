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
const PRIMARY_KEY = (import.meta.env.VITE_GECKO_API_KEY ?? "").trim();
const FALLBACK_KEY = (import.meta.env.VITE_GECKO_API_KEY_FALLBACK ?? "").trim();
// Ordem de tentativa: chave principal primeiro; a fallback entra só quando a principal
// fica sem saldo (créditos insuficientes). Vazias e duplicadas são descartadas.
const API_KEYS = [PRIMARY_KEY, FALLBACK_KEY].filter(
  (key, index, all) => key.length > 0 && all.indexOf(key) === index,
);
const HAS_KEY = API_KEYS.length > 0;
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
export const fetchCredits = async (apiKey: string = API_KEYS[0] ?? ""): Promise<number | null> => {
  if (!ENABLED || !apiKey) {
    return null;
  }

  try {
    return await withTimeout(CREDITS_TIMEOUT_MS, async (signal) => {
      const response = await fetch(`${BASE_URL}/v1/me/credits`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
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

const postExtract = (keyword: string, apiKey: string): Promise<GeckoShopeePlpResponse> =>
  withTimeout(EXTRACT_TIMEOUT_MS, async (signal) => {
    const response = await fetch(`${BASE_URL}/v1/extract`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
 *   3. GeckoAPI real (habilitada + chave + créditos) — tenta a chave principal e,
 *      se ela estiver sem saldo, repete com a chave de fallback.
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

  if (!HAS_KEY) {
    return { ok: false, error: errorInfo("missing_key") };
  }

  // Tenta cada chave na ordem (principal → fallback). Só passamos para a próxima
  // quando a chave atual está sem saldo; outros erros valem para qualquer chave.
  let lastError = errorInfo("insufficient_credits");
  for (const apiKey of API_KEYS) {
    const outcome = await attemptWithKey(keyword, normalized, apiKey);

    if (outcome.ok) {
      return { ok: true, benchmark: outcome.benchmark, source: "live" };
    }

    lastError = outcome.error;
    if (!outcome.insufficientCredits) {
      return { ok: false, error: outcome.error };
    }
  }

  return { ok: false, error: lastError };
};

type AttemptOutcome =
  | { ok: true; benchmark: MarketBenchmarkFromGecko }
  | { ok: false; error: GeckoErrorInfo; insufficientCredits: boolean };

/**
 * Uma tentativa de extração com UMA chave. Sinaliza `insufficientCredits` para o
 * chamador decidir se vale tentar a próxima chave (saldo) ou parar (demais erros).
 */
const attemptWithKey = async (
  keyword: string,
  normalized: string,
  apiKey: string,
): Promise<AttemptOutcome> => {
  // Pré-check de créditos: a chamada principal custa 25 créditos e é lenta.
  // Se já sabemos que não há saldo nesta chave, evitamos a espera.
  const credits = await fetchCredits(apiKey);
  if (credits !== null && credits < CREDIT_COST) {
    return { ok: false, error: errorInfo("insufficient_credits"), insufficientCredits: true };
  }

  try {
    const response = await postExtract(keyword.trim(), apiKey);

    if (response.notFound || !response.data || !(response.data.items?.length ?? 0)) {
      return { ok: false, error: errorInfo("not_found"), insufficientCredits: false };
    }

    const benchmark = normalizeGeckoShopeePlp(response, keyword.trim(), LIVE_SOURCE);

    if (benchmark.itemsAnalyzed === 0) {
      return { ok: false, error: errorInfo("not_found"), insufficientCredits: false };
    }

    writeCache(normalized, benchmark);
    return { ok: true, benchmark };
  } catch (error) {
    const info = mapGeckoError(error);
    return { ok: false, error: info, insufficientCredits: info.type === "insufficient_credits" };
  }
};

// Exposto para a UI poder dar dicas em dev (ex.: helper discreto quando sem chave).
export const geckoConfig = {
  enabled: ENABLED,
  hasKey: HAS_KEY,
  hasFallbackKey: API_KEYS.length > 1,
  mockMode: MOCK_MODE,
};
