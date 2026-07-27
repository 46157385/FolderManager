import { nextTick, onActivated, onDeactivated } from 'vue'
import { useRoute } from 'vue-router'

const scrollPositions = new Map<string, number>()

/** Preserve window scroll for each cached route across deactivate / activate. */
export function useScrollPosition() {
  const route = useRoute()
  const scrollKey = route.fullPath
  let restoreFrame: number | null = null
  let savedBeforeDeactivation = false

  function saveScrollPosition() {
    scrollPositions.set(scrollKey, window.scrollY)
    savedBeforeDeactivation = true
  }

  onDeactivated(() => {
    if (restoreFrame !== null) {
      window.cancelAnimationFrame(restoreFrame)
      restoreFrame = null
    }

    if (!savedBeforeDeactivation) {
      saveScrollPosition()
    }
  })

  onActivated(() => {
    const scrollY = scrollPositions.get(scrollKey) ?? 0

    nextTick(() => {
      restoreFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' })
        restoreFrame = null
        savedBeforeDeactivation = false
      })
    })
  })

  return { saveScrollPosition }
}
