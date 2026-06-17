// Chave normalizada para casar um benchmark de categoria entre o formulário
// (onde a busca GeckoAPI acontece) e o diagnóstico (onde o insight é exibido).
export const normalizeCategoryKey = (categoria: string) => categoria.trim().toLowerCase();

// Categorias que consultam a GeckoAPI ao vivo durante a apresentação.
// As demais permanecem com benchmark estático (Joompulse), apenas exibido —
// evita consumir créditos e reduz risco de falha ao vivo no pitch.
export const LIVE_GECKO_CATEGORIES = [
  "Conjuntos e Pacotes de Acessórios",
  "Pulseiras e Braceletes",
].map(normalizeCategoryKey);

export const isLiveGeckoCategory = (categoria: string) =>
  LIVE_GECKO_CATEGORIES.includes(normalizeCategoryKey(categoria));
