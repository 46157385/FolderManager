import { onScopeDispose, readonly, shallowRef } from 'vue'

import { isBackendEnabled } from '@/config/features'
import type { MaterialCollection } from '@/types/material'
import type {
  OutlineNode,
  SectionOutline,
} from '@/types/sectionOutline'
import { getMaterialSummary } from '@/services/folderManagerApi'
import { getMaterialSummaryUrl } from '@/utils/materialSummaryUrl'

export type MaterialSummaryLoadState = 'idle' | 'loading' | 'success' | 'missing' | 'error'

interface LoadMaterialSummaryOptions {
  collection: MaterialCollection
  materialId: string
}

const summaryCache = new Map<string, SectionOutline>()

export function useMaterialSummary() {
  const summary = shallowRef<SectionOutline | null>(null)
  const loadState = shallowRef<MaterialSummaryLoadState>('idle')
  const errorMessage = shallowRef('')
  let activeController: AbortController | null = null

  async function load(options: LoadMaterialSummaryOptions) {
    cancel()
    summary.value = null
    errorMessage.value = ''

    const cacheKey = `${options.collection}:${options.materialId}`
    const cachedSummary = summaryCache.get(cacheKey)

    if (cachedSummary) {
      summary.value = cachedSummary
      loadState.value = 'success'
      return
    }

    const controller = new AbortController()
    activeController = controller
    loadState.value = 'loading'

    try {
      const rawSummary = await loadSummaryDocument(options, controller.signal)
      if (rawSummary === undefined) {
        loadState.value = 'missing'
        return
      }

      const nextSummary = parseMaterialSummary(rawSummary)
      if (
        nextSummary.collection !== options.collection
        || nextSummary.materialId !== options.materialId
      ) {
        throw new Error('SUMMARY_ID_MISMATCH')
      }

      const outline: SectionOutline = {
        schemaVersion: 1,
        collection: nextSummary.collection,
        sectionId: nextSummary.sectionId,
        title: nextSummary.title,
        summary: nextSummary.summary,
        keyPoints: nextSummary.keyPoints,
        root: nextSummary.root,
        sources: [{ materialId: nextSummary.materialId, title: nextSummary.title }],
        sourceHash: nextSummary.sourceHash,
        generatedAt: nextSummary.generatedAt,
      }

      summaryCache.set(cacheKey, outline)
      summary.value = outline
      loadState.value = 'success'
    }
    catch (error) {
      if (isAbortError(error)) {
        return
      }

      loadState.value = 'error'
      errorMessage.value = getLoadErrorMessage(error)
    }
    finally {
      if (activeController === controller) {
        activeController = null
      }
    }
  }

  function cancel() {
    activeController?.abort()
    activeController = null
  }

  function reset() {
    cancel()
    summary.value = null
    loadState.value = 'idle'
    errorMessage.value = ''
  }

  onScopeDispose(cancel)

  return {
    summary: readonly(summary),
    loadState: readonly(loadState),
    errorMessage: readonly(errorMessage),
    load,
    reset,
  }
}

async function loadSummaryDocument(
  options: LoadMaterialSummaryOptions,
  signal: AbortSignal,
) {
  let backendError: unknown

  if (isBackendEnabled) {
    try {
      const backendSummary = await getMaterialSummary(options.materialId, signal)
      if (backendSummary !== undefined) {
        return backendSummary
      }
    }
    catch (error) {
      if (isAbortError(error)) {
        throw error
      }
      backendError = error
    }
  }

  const legacySummary = await loadLegacySummary(options, signal)
  if (legacySummary !== undefined) {
    return legacySummary
  }
  if (backendError) {
    throw backendError
  }
  return undefined
}

async function loadLegacySummary(
  options: LoadMaterialSummaryOptions,
  signal: AbortSignal,
) {
  const response = await fetch(
    getMaterialSummaryUrl(options.collection, options.materialId),
    {
      headers: { Accept: 'application/json' },
      signal,
    },
  )
  if (response.status === 404) {
    return undefined
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return undefined
  }
  return await response.json() as unknown
}

interface MaterialSummaryDocument {
  collection: MaterialCollection
  sectionId: string
  materialId: string
  title: string
  summary: string
  keyPoints: string[]
  root: OutlineNode
  sourceHash: string
  generatedAt: string
}

function parseMaterialSummary(value: unknown): MaterialSummaryDocument {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('INVALID_SUMMARY')
  }

  return {
    collection: readCollection(value.collection),
    sectionId: readString(value.sectionId),
    materialId: readString(value.materialId),
    title: readString(value.title),
    summary: readString(value.summary),
    keyPoints: readArray(value.keyPoints).map(readString),
    root: readOutlineNode(value.root),
    sourceHash: readString(value.sourceHash),
    generatedAt: readString(value.generatedAt),
  }
}

function readOutlineNode(value: unknown): OutlineNode {
  if (!isRecord(value)) {
    throw new Error('INVALID_SUMMARY')
  }

  return {
    id: readString(value.id),
    label: readString(value.label),
    ...(value.detail === undefined ? {} : { detail: readString(value.detail) }),
    children: readArray(value.children).map(readOutlineNode),
  }
}

function readCollection(value: unknown): MaterialCollection {
  if (value !== 'session5' && value !== 'thinking') {
    throw new Error('INVALID_SUMMARY')
  }
  return value
}

function readString(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('INVALID_SUMMARY')
  }
  return value
}

function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('INVALID_SUMMARY')
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getLoadErrorMessage(error: unknown) {
  if (
    error instanceof Error
    && (error.message === 'INVALID_SUMMARY' || error.message === 'SUMMARY_ID_MISMATCH')
  ) {
    return '文章总结数据格式不正确，请重新生成。'
  }
  return '文章总结加载失败，请稍后重试。'
}
