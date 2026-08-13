/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_BACKEND?: string
  readonly VITE_ENABLE_AI_KNOWLEDGE?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_MATERIALS_BASE_URL?: string
  readonly VITE_THINKING_MATERIALS_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
