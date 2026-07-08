import { shallowRef, watch, type ShallowRef } from 'vue'

import { useCloudAuth } from '@/composables/useCloudAuth'
import {
  beginCloudWrite,
  failCloudWrite,
  finishCloudWrite,
  markCloudSynced,
} from '@/composables/useCloudSyncStatus'
import { supabaseServices } from '@/services/supabase'

interface UseSyncedStorageStateOptions<T> {
  key: string
  fallback: T
  cloudKey: string
  merge: (localValue: T, remoteValue: T) => T
}

interface SyncStateRow<T> {
  user_id: string
  state_key: string
  value?: T
}

export function useSyncedStorageState<T>(options: UseSyncedStorageStateOptions<T>): ShallowRef<T> {
  const state = shallowRef<T>(readValue(getStorageKey(options.key, null), options.fallback))
  const { user } = useCloudAuth()
  let applyingRemoteValue = false
  let skipNextCloudWrite = false
  let writeTimer: number | undefined
  let activeUserId: string | null = null
  let activeStorageKey = getStorageKey(options.key, null)

  watch(
    user,
    async (nextUser) => {
      activeUserId = nextUser?.id ?? null
      activeStorageKey = getStorageKey(options.key, activeUserId)
      window.clearTimeout(writeTimer)
      applyValue(readValue(activeStorageKey, options.fallback))

      if (!nextUser || !supabaseServices) {
        return
      }

      await loadCloudValue(nextUser.id)
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

      if (!applyingRemoteValue) {
        scheduleCloudWrite()
      }
    },
    { deep: true },
  )

  function scheduleCloudWrite() {
    window.clearTimeout(writeTimer)
    writeTimer = window.setTimeout(writeCloudValue, 250)
  }

  async function writeCloudValue() {
    const currentUser = user.value

    if (!currentUser || !supabaseServices) {
      return
    }

    beginCloudWrite()

    try {
      const { error } = await supabaseServices.client
        .from('user_sync_state')
        .upsert(
          {
            user_id: currentUser.id,
            state_key: options.cloudKey,
            value: state.value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,state_key',
          },
        )

      if (error) {
        throw error
      }

      finishCloudWrite()
    }
    catch (error) {
      failCloudWrite(error)
    }
  }

  async function loadCloudValue(userId: string) {
    if (!supabaseServices) {
      return
    }

    beginCloudWrite()

    try {
      const { data, error } = await supabaseServices.client
        .from('user_sync_state')
        .select('user_id,state_key,value')
        .eq('user_id', userId)
        .eq('state_key', options.cloudKey)
        .maybeSingle<SyncStateRow<T>>()

      if (error) {
        throw error
      }

      if (activeUserId !== userId) {
        return
      }

      if (data?.value === undefined) {
        await writeCloudValue()
        return
      }

      const mergedValue = options.merge(state.value, data.value)

      if (!isEqual(state.value, mergedValue)) {
        applyValue(mergedValue)
      }

      if (!isEqual(data.value, mergedValue)) {
        scheduleCloudWrite()
        return
      }

      markCloudSynced()
    }
    catch (error) {
      failCloudWrite(error)
    }
    finally {
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
