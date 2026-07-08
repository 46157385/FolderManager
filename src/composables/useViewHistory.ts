import { computed } from 'vue'

import type { MaterialItem, ViewHistory } from '@/types/material'
import { getMaterialTitle } from '@/utils/materialTitle'
import { useSyncedStorageState } from './useSyncedStorageState'

const history = useSyncedStorageState<ViewHistory[]>({
  key: 'folder-manager:view-history',
  fallback: [],
  cloudKey: 'history',
  merge: mergeHistory,
})

export function useViewHistory() {
  const recentHistory = computed(() => history.value.slice(0, 20))

  function recordHistory(material: MaterialItem) {
    const viewedAt = new Date().toISOString()

    history.value = [
      {
        id: `${material.id}-${viewedAt}`,
        materialId: material.id,
        materialName: getMaterialTitle(material),
        viewedAt,
      },
      ...history.value,
    ].slice(0, 100)
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

  return Array.from(historyById.values())
    .sort((left, right) => right.viewedAt.localeCompare(left.viewedAt))
    .slice(0, 100)
}
