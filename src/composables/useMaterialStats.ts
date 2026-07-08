import { computed } from 'vue'

import type { MaterialStats } from '@/types/material'
import { useSyncedStorageState } from './useSyncedStorageState'

const stats = useSyncedStorageState<Record<string, MaterialStats>>({
  key: 'folder-manager:stats',
  fallback: {},
  cloudKey: 'stats',
  merge: mergeMaterialStats,
})

export function useMaterialStats(materialId?: string) {
  const materialStats = computed(() => {
    if (!materialId) {
      return undefined
    }

    return stats.value[materialId]
  })

  const viewCount = computed(() => materialStats.value?.viewCount ?? 0)

  function recordView(targetMaterialId: string) {
    const previous = stats.value[targetMaterialId]
    const now = new Date().toISOString()

    stats.value = {
      ...stats.value,
      [targetMaterialId]: {
        materialId: targetMaterialId,
        viewCount: (previous?.viewCount ?? 0) + 1,
        lastViewedAt: now,
      },
    }
  }

  return {
    stats,
    materialStats,
    viewCount,
    recordView,
  }
}

function mergeMaterialStats(
  localValue: Record<string, MaterialStats>,
  remoteValue: Record<string, MaterialStats>,
) {
  const materialIds = new Set([...Object.keys(remoteValue), ...Object.keys(localValue)])
  const mergedStats: Record<string, MaterialStats> = {}

  for (const materialId of materialIds) {
    const localStats = localValue[materialId]
    const remoteStats = remoteValue[materialId]

    if (!localStats || !remoteStats) {
      mergedStats[materialId] = localStats ?? remoteStats
      continue
    }

    mergedStats[materialId] = {
      materialId,
      viewCount: Math.max(localStats.viewCount, remoteStats.viewCount),
      lastViewedAt: getLatestDate(localStats.lastViewedAt, remoteStats.lastViewedAt),
    }
  }

  return mergedStats
}

function getLatestDate(left?: string, right?: string) {
  if (!left) {
    return right
  }

  if (!right) {
    return left
  }

  return left > right ? left : right
}
