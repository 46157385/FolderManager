import { shallowRef, watch } from 'vue'

export function useLocalStorageState<T>(key: string, fallback: T) {
  const state = shallowRef<T>(readValue(key, fallback))

  watch(
    state,
    (value) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    },
    { deep: true },
  )

  return state
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
