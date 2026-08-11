import { onScopeDispose, readonly, shallowRef } from 'vue'

import type { MaterialCollection } from '@/types/material'
import type {
  OutlineNode,
  SectionOutline,
  SectionOutlineSource,
} from '@/types/sectionOutline'
import { getSectionOutlineUrl } from '@/utils/sectionOutlineUrl'

export type SectionOutlineLoadState = 'idle' | 'loading' | 'success' | 'missing' | 'error'

interface LoadSectionOutlineOptions {
  collection: MaterialCollection
  sectionId: string
}

const outlineCache = new Map<string, SectionOutline>()

export function useSectionOutline() {
  const outline = shallowRef<SectionOutline | null>(null)
  const loadState = shallowRef<SectionOutlineLoadState>('idle')
  const errorMessage = shallowRef('')
  let activeController: AbortController | null = null

  async function load(options: LoadSectionOutlineOptions) {
    cancel()
    outline.value = null
    errorMessage.value = ''

    const url = getSectionOutlineUrl(options.collection, options.sectionId)
    const cachedOutline = outlineCache.get(url)

    if (cachedOutline) {
      outline.value = cachedOutline
      loadState.value = 'success'
      return
    }

    const controller = new AbortController()
    activeController = controller
    loadState.value = 'loading'

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (response.status === 404) {
        loadState.value = 'missing'
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (!response.headers.get('content-type')?.includes('application/json')) {
        loadState.value = 'missing'
        return
      }

      const nextOutline = parseSectionOutline(await response.json())

      if (
        nextOutline.collection !== options.collection
        || nextOutline.sectionId !== options.sectionId
      ) {
        throw new Error('OUTLINE_ID_MISMATCH')
      }

      outlineCache.set(url, nextOutline)
      outline.value = nextOutline
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
    outline.value = null
    loadState.value = 'idle'
    errorMessage.value = ''
  }

  onScopeDispose(cancel)

  return {
    outline: readonly(outline),
    loadState: readonly(loadState),
    errorMessage: readonly(errorMessage),
    load,
    reset,
  }
}

function parseSectionOutline(value: unknown): SectionOutline {
  if (!isRecord(value)) {
    throw new Error('INVALID_OUTLINE')
  }

  const outline: SectionOutline = {
    schemaVersion: 1,
    collection: readCollection(value.collection),
    sectionId: readString(value.sectionId),
    title: readString(value.title),
    summary: readString(value.summary),
    keyPoints: readStringArray(value.keyPoints),
    root: readOutlineNode(value.root),
    sources: readSources(value.sources),
    sourceHash: readString(value.sourceHash),
    generatedAt: readString(value.generatedAt),
  }

  if (value.schemaVersion !== 1) {
    throw new Error('INVALID_OUTLINE')
  }

  return outline
}

function readOutlineNode(value: unknown): OutlineNode {
  if (!isRecord(value)) {
    throw new Error('INVALID_OUTLINE')
  }

  return {
    id: readString(value.id),
    label: readString(value.label),
    ...(value.detail === undefined ? {} : { detail: readString(value.detail) }),
    children: readArray(value.children).map(readOutlineNode),
  }
}

function readSources(value: unknown): SectionOutlineSource[] {
  return readArray(value).map((source) => {
    if (!isRecord(source)) {
      throw new Error('INVALID_OUTLINE')
    }

    return {
      materialId: readString(source.materialId),
      title: readString(source.title),
    }
  })
}

function readCollection(value: unknown): MaterialCollection {
  if (value !== 'session5' && value !== 'thinking') {
    throw new Error('INVALID_OUTLINE')
  }

  return value
}

function readString(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('INVALID_OUTLINE')
  }

  return value
}

function readStringArray(value: unknown) {
  return readArray(value).map(readString)
}

function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('INVALID_OUTLINE')
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
    && (error.message === 'INVALID_OUTLINE' || error.message === 'OUTLINE_ID_MISMATCH')
  ) {
    return '大纲数据格式不正确，请重新生成。'
  }

  return '大纲加载失败，请稍后重试。'
}
