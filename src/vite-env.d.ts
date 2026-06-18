/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GECKO_API_ENABLED?: string;
  readonly VITE_GECKO_API_KEY?: string;
  readonly VITE_GECKO_API_KEY_FALLBACK?: string;
  readonly VITE_GECKO_API_BASE_URL?: string;
  readonly VITE_GECKO_API_MOCK_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
