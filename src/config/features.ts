const isExplicitlyEnabled = (value: string | undefined) => value === 'true'

// 本地开发始终保留 Java/Ollama/OCR 调试能力；正式环境必须显式开启。
export const isBackendEnabled = import.meta.env.DEV
  || isExplicitlyEnabled(import.meta.env.VITE_ENABLE_BACKEND)

export const isCloudSyncEnabled = isBackendEnabled

export const isKnowledgeBaseEnabled = isBackendEnabled
  && (
    import.meta.env.DEV
    || isExplicitlyEnabled(import.meta.env.VITE_ENABLE_AI_KNOWLEDGE)
  )
