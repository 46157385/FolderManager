import { computed, watch } from 'vue'

import type { MaterialItem, ViewHistory } from '@/types/material'
import { getMaterialTitle } from '@/utils/materialTitle'
import { useSyncedStorageState } from './useSyncedStorageState'

const history = useSyncedStorageState<ViewHistory[]>({
  key: 'folder-manager:view-history',
  fallback: [],
  cloudKey: 'history',
  merge: mergeHistory,
})

const HISTORY_RETENTION_DAYS = 30
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

watch(
  history,
  (value) => {
    const retainedHistory = retainRecentHistory(value)

    if (retainedHistory.length !== value.length) {
      history.value = retainedHistory
    }
  },
  { immediate: true },
)

export function useViewHistory() {
  const recentHistory = computed(() => retainRecentHistory(history.value))

  function recordHistory(material: MaterialItem) {
    const viewedAt = new Date().toISOString()

    history.value = retainRecentHistory([
      {
        id: `${material.id}-${viewedAt}`,
        materialId: material.id,
        materialName: getMaterialTitle(material),
        viewedAt,
      },
      ...history.value,
    ])
  }

  return {
    history,
    recentHistory,
    recordHistory,
  }
}

function mergeHistory(localValue: ViewHistory[], remoteValue: ViewHistory[]) {
  const historyById = new Map<string, ViewHistory>()

  for (const record of [...remoteValue, ...localValue]) {
    historyById.set(record.id, record)
  }

  return retainRecentHistory(Array.from(historyById.values()))
}

function retainRecentHistory(value: ViewHistory[]) {
  const cutoff = Date.now() - HISTORY_RETENTION_DAYS * MILLISECONDS_PER_DAY

  return value
    .filter((record) => {
      const viewedAt = Date.parse(record.viewedAt)
      return Number.isFinite(viewedAt) && viewedAt >= cutoff
    })
    .sort((left, right) => right.viewedAt.localeCompare(left.viewedAt))
}
