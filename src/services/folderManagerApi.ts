import { supabaseServices } from '@/services/supabase'
import type { MaterialCollection } from '@/types/material'
import type {
  KnowledgeAnswer,
  KnowledgeSource,
  KnowledgeStreamEvent,
} from '@/types/knowledge'

const DEFAULT_API_BASE_URL = '/api/v1'
const API_PATH_PREFIX = '/api/v1'
const JSON_CONTENT_TYPE_PATTERN = /\b(?:application|text)\/(?:[^;+]+\+)?json\b/i
const NDJSON_CONTENT_TYPE_PATTERN = /\bapplication\/(?:x-)?ndjson\b/i
const apiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
)

export interface FolderApiResponse {
  id: string
  name: string
  materialCount: number
}

export interface MaterialApiResponse {
  id: string
  folderId: string
  name: string
  collection: MaterialCollection
  pdfUrl: string
  audioUrl: string | null
}

interface PageApiResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

interface SyncStateApiResponse<T> {
  key: string
  value: T
  updatedAt: string
}

interface ProblemDetail {
  status?: number
  errorCode?: string
  detail?: string
  title?: string
}

interface ApiRequestOptions extends RequestInit {
  authenticated?: boolean
  allowNotFound?: boolean
}

export class FolderManagerApiError extends Error {
  readonly status: number
  readonly errorCode?: string

  constructor(status: number, message: string, errorCode?: string) {
    super(message)
    this.name = 'FolderManagerApiError'
    this.status = status
    this.errorCode = errorCode
  }
}

export async function getFolders(): Promise<FolderApiResponse[]> {
  const folders = await requestJson<FolderApiResponse[]>('/folders')

  if (!folders) {
    throw new FolderManagerApiError(502, '后端未返回文件夹目录', 'empty_response')
  }

  return folders
}

export async function getAllMaterials() {
  const firstPage = await getMaterialPage(0)

  if (firstPage.totalPages <= 1) {
    return firstPage.items
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.totalPages - 1 },
      (_, index) => getMaterialPage(index + 1),
    ),
  )

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ]
}

export async function getSyncState<T>(key: string): Promise<T | undefined> {
  const state = await requestJson<SyncStateApiResponse<T>>(
    `/me/sync-states/${encodeURIComponent(key)}`,
    {
      authenticated: true,
      allowNotFound: true,
    },
  )

  return state?.value
}

export async function putSyncState<T>(key: string, value: T): Promise<void> {
  await requestJson<SyncStateApiResponse<T>>(
    `/me/sync-states/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      authenticated: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    },
  )
}

export async function getMaterialSummary(
  materialId: string,
  signal?: AbortSignal,
): Promise<unknown | undefined> {
  return await requestJson<unknown>(
    `/materials/${encodeURIComponent(materialId)}/summary`,
    {
      allowNotFound: true,
      signal,
    },
  )
}

export async function askKnowledgeBase(
  knowledgeBaseId: string,
  question: string,
): Promise<KnowledgeAnswer> {
  const answer = await requestJson<KnowledgeAnswer>(
    `/knowledge-bases/${encodeURIComponent(knowledgeBaseId)}/questions`,
    {
      method: 'POST',
      authenticated: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    },
  )

  if (!answer) {
    throw new FolderManagerApiError(502, '后端未返回问答内容', 'empty_response')
  }

  return answer
}

export async function askKnowledgeBaseStream(
  knowledgeBaseId: string,
  question: string,
  onDelta: (delta: string) => void,
): Promise<KnowledgeAnswer> {
  const headers = new Headers({
    Accept: 'application/x-ndjson',
    'Content-Type': 'application/json',
  })
  headers.set('Authorization', `Bearer ${await requireAccessToken()}`)

  const response = await fetch(
    resolveBackendUrl(
      `/knowledge-bases/${encodeURIComponent(knowledgeBaseId)}/questions/stream`,
    ),
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ question }),
    },
  )

  if (!response.ok) {
    throw await createApiError(response)
  }
  if (!hasExpectedContentType(response, NDJSON_CONTENT_TYPE_PATTERN)) {
    throw createUnexpectedContentTypeError(response, 'NDJSON')
  }
  if (!response.body) {
    throw new FolderManagerApiError(502, '浏览器未收到流式响应', 'empty_response')
  }

  return await readKnowledgeAnswerStream(
    response.body,
    knowledgeBaseId,
    onDelta,
  )
}

export function resolveBackendUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  if (path === API_PATH_PREFIX || path.startsWith(`${API_PATH_PREFIX}/`)) {
    return `${apiBaseUrl}${path.slice(API_PATH_PREFIX.length)}`
  }

  return `${apiBaseUrl}/${path.replace(/^\/+/, '')}`
}

async function getMaterialPage(
  page: number,
): Promise<PageApiResponse<MaterialApiResponse>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: '100',
  })

  const materialPage = await requestJson<PageApiResponse<MaterialApiResponse>>(
    `/materials?${searchParams.toString()}`,
  )

  if (!materialPage) {
    throw new FolderManagerApiError(502, '后端未返回资料目录', 'empty_response')
  }

  return materialPage
}

async function requestJson<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T | undefined> {
  const {
    authenticated = false,
    allowNotFound = false,
    headers: configuredHeaders,
    ...requestOptions
  } = options
  const headers = new Headers(configuredHeaders)
  headers.set('Accept', 'application/json')

  if (authenticated) {
    headers.set('Authorization', `Bearer ${await requireAccessToken()}`)
  }

  const response = await fetch(resolveBackendUrl(path), {
    ...requestOptions,
    headers,
  })

  if (allowNotFound && response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw await createApiError(response)
  }

  if (response.status === 204) {
    return undefined
  }

  if (!hasExpectedContentType(response, JSON_CONTENT_TYPE_PATTERN)) {
    throw createUnexpectedContentTypeError(response, 'JSON')
  }

  const responseText = await response.text()
  if (!responseText.trim()) {
    return undefined
  }

  try {
    return JSON.parse(responseText) as T
  }
  catch {
    throw new FolderManagerApiError(
      502,
      '后端返回了无效的 JSON 数据',
      'invalid_json_response',
    )
  }
}

async function requireAccessToken() {
  if (!supabaseServices) {
    throw new FolderManagerApiError(401, 'Supabase 尚未配置', 'authentication_required')
  }

  const { data, error } = await supabaseServices.client.auth.getSession()

  if (error) {
    throw new FolderManagerApiError(401, error.message, 'authentication_required')
  }

  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new FolderManagerApiError(401, '请先登录后再同步', 'authentication_required')
  }

  return accessToken
}

async function createApiError(response: Response) {
  let problem: ProblemDetail | undefined

  try {
    if (hasExpectedContentType(response, JSON_CONTENT_TYPE_PATTERN)) {
      problem = JSON.parse(await response.text()) as ProblemDetail
    }
  }
  catch {
    problem = undefined
  }

  return new FolderManagerApiError(
    response.status,
    problem?.detail || problem?.title || `请求失败（HTTP ${response.status}）`,
    problem?.errorCode,
  )
}

function hasExpectedContentType(response: Response, pattern: RegExp) {
  return pattern.test(response.headers.get('content-type') ?? '')
}

function createUnexpectedContentTypeError(
  response: Response,
  expectedType: 'JSON' | 'NDJSON',
) {
  const receivedType = response.headers.get('content-type')?.split(';', 1)[0]
  const receivedDescription = receivedType || '未声明 Content-Type 的内容'

  return new FolderManagerApiError(
    502,
    `后端接口未返回 ${expectedType}（收到 ${receivedDescription}），请检查正式环境的 API 地址或代理配置`,
    'unexpected_response_content_type',
  )
}

async function readKnowledgeAnswerStream(
  body: ReadableStream<Uint8Array>,
  knowledgeBaseId: string,
  onDelta: (delta: string) => void,
): Promise<KnowledgeAnswer> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let sources: KnowledgeSource[] = []
  let completed = false

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const event = parseKnowledgeStreamEvent(line)
      if (!event) {
        continue
      }
      if (event.type === 'delta') {
        answer += event.content
        onDelta(event.content)
      }
      else if (event.type === 'sources') {
        sources = event.sources
      }
      else if (event.type === 'error') {
        throw new FolderManagerApiError(
          502,
          event.message,
          event.errorCode,
        )
      }
      else if (event.type === 'done') {
        completed = true
      }
    }

    if (done) {
      break
    }
  }

  const finalEvent = parseKnowledgeStreamEvent(buffer)
  if (finalEvent?.type === 'error') {
    throw new FolderManagerApiError(502, finalEvent.message, finalEvent.errorCode)
  }
  if (!completed || !answer.trim()) {
    throw new FolderManagerApiError(502, '流式回答意外中断', 'incomplete_stream')
  }

  return {
    knowledgeBaseId,
    answer,
    sources,
  }
}

function parseKnowledgeStreamEvent(line: string): KnowledgeStreamEvent | undefined {
  const normalizedLine = line.trim()
  if (!normalizedLine) {
    return undefined
  }
  try {
    return JSON.parse(normalizedLine) as KnowledgeStreamEvent
  }
  catch {
    throw new FolderManagerApiError(502, '后端返回了无效的流式数据', 'invalid_stream')
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}
