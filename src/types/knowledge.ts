export type KnowledgeSourceType = 'outline' | 'article'

export interface KnowledgeSource {
  reference: number
  materialId: string
  title: string
  sourceType: KnowledgeSourceType
  section: string
  excerpt: string
  score: number
}

export interface KnowledgeAnswer {
  knowledgeBaseId: string
  answer: string
  sources: KnowledgeSource[]
}

export type KnowledgeStreamEvent =
  | { type: 'delta', content: string }
  | { type: 'sources', sources: KnowledgeSource[] }
  | { type: 'done' }
  | { type: 'error', errorCode?: string, message: string }

export interface KnowledgeChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: readonly KnowledgeSource[]
  streaming?: boolean
}
