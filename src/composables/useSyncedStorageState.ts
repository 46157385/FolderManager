import { shallowRef, watch, type ShallowRef } from 'vue'

import { useCloudAuth } from '@/composables/useCloudAuth'
import {
  beginCloudWrite,
  failCloudWrite,
  finishCloudWrite,
  markCloudSynced,
} from '@/composables/useCloudSyncStatus'
import { getSyncState, putSyncState } from '@/services/folderManagerApi'

interface UseSyncedStorageStateOptions<T> {
  key: string
  fallback: T
  cloudKey: string
  merge: (localValue: T, remoteValue: T) => T
}

export function useSyncedStorageState<T>(options: UseSyncedStorageStateOptions<T>): ShallowRef<T> {
  const state = shallowRef<T>(readValue(getStorageKey(options.key, null), options.fallback))
  const { user } = useCloudAuth()
  let applyingRemoteValue = false
  let skipNextCloudWrite = false
  let writeTimer: number | undefined
  let activeUserId: string | null = null
  let activeStorageKey = getStorageKey(options.key, null)
  let hydratedUserId: string | null = null
  let loadSeq = 0
  let isHydrating = false
  let hasPendingWrite = false

  watch(
    () => user.value?.id ?? null,
    async (userId) => {
      activeUserId = userId
      activeStorageKey = getStorageKey(options.key, userId)
      window.clearTimeout(writeTimer)
      hasPendingWrite = false
      applyValue(readValue(activeStorageKey, options.fallback))

      if (!userId) {
        hydratedUserId = null
        return
      }

      // 同一用户已完成过云端 hydrate，不再重复 GET
      if (hydratedUserId === userId) {
        return
      }

      await loadCloudValue(userId)
    },
    { immediate: true },
  )

  watch(
    state,
    (value) => {
      writeLocalValue(activeStorageKey, value)

      if (skipNextCloudWrite) {
        skipNextCloudWrite = false
        return
      }

      if (applyingRemoteValue) {
        return
      }

      // hydrate 期间的本地写入（如打开阅读页记浏览量）先攒着，结束后统一写一次
      if (isHydrating) {
        hasPendingWrite = true
        return
      }

      scheduleCloudWrite()
    },
    { deep: true },
  )

  function scheduleCloudWrite() {
    window.clearTimeout(writeTimer)
    writeTimer = window.setTimeout(() => {
      void writeCloudValue()
    }, 250)
  }

  async function writeCloudValue() {
    const currentUser = user.value

    if (!currentUser) {
      return
    }

    beginCloudWrite()

    try {
      await putSyncState(options.cloudKey, state.value)
      finishCloudWrite()
    }
    catch (error) {
      failCloudWrite(error)
    }
  }

  async function loadCloudValue(userId: string) {
    const seq = ++loadSeq
    isHydrating = true
    beginCloudWrite()

    try {
      const remoteValue = await getSyncState<T>(options.cloudKey)

      if (seq !== loadSeq || activeUserId !== userId) {
        return
      }

      let shouldWrite = hasPendingWrite
      hasPendingWrite = false

      if (remoteValue === undefined) {
        shouldWrite = true
      }
      else {
        const mergedValue = options.merge(state.value, remoteValue)

        if (!isEqual(state.value, mergedValue)) {
          applyValue(mergedValue)
        }

        if (!isEqual(remoteValue, mergedValue)) {
          shouldWrite = true
        }
      }

      hydratedUserId = userId

      if (shouldWrite) {
        await writeCloudValue()
        return
      }

      markCloudSynced()
    }
    catch (error) {
      failCloudWrite(error)
    }
    finally {
      if (seq === loadSeq) {
        isHydrating = false

        if (hasPendingWrite) {
          hasPendingWrite = false
          scheduleCloudWrite()
        }
      }

      finishCloudWrite()
    }
  }

  return state

  function applyValue(value: T) {
    if (isEqual(state.value, value)) {
      writeLocalValue(activeStorageKey, value)
      return
    }

    applyingRemoteValue = true
    skipNextCloudWrite = true
    state.value = value
    writeLocalValue(activeStorageKey, value)
    applyingRemoteValue = false
  }
}

function getStorageKey(key: string, userId: string | null) {
  return userId ? `${key}:user:${userId}` : key
}

function readValue<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  }
  catch {
    return fallback
  }
}

function writeLocalValue<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function isEqual<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right)
}
