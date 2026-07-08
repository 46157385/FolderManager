import { readonly, shallowRef } from 'vue'

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error'

const syncState = shallowRef<CloudSyncState>('idle')
const syncError = shallowRef<string | null>(null)
const lastSyncedAt = shallowRef<string | null>(null)
let activeWrites = 0

export function useCloudSyncStatus() {
  return {
    syncState: readonly(syncState),
    syncError: readonly(syncError),
    lastSyncedAt: readonly(lastSyncedAt),
  }
}

export function beginCloudWrite() {
  activeWrites += 1
  syncState.value = 'syncing'
  syncError.value = null
}

export function finishCloudWrite() {
  activeWrites = Math.max(0, activeWrites - 1)

  if (activeWrites === 0) {
    syncState.value = 'synced'
    lastSyncedAt.value = new Date().toISOString()
  }
}

export function failCloudWrite(error: unknown) {
  activeWrites = Math.max(0, activeWrites - 1)
  syncState.value = 'error'
  syncError.value = error instanceof Error ? error.message : '云同步失败'
}

export function markCloudSynced() {
  if (activeWrites > 0) {
    return
  }

  syncState.value = 'synced'
  syncError.value = null
  lastSyncedAt.value = new Date().toISOString()
}
