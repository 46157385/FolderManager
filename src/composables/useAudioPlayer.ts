import { computed, readonly, shallowRef } from 'vue'

import type { MaterialItem } from '@/types/material'

const currentMaterial = shallowRef<MaterialItem | null>(null)
const isPlaying = shallowRef(false)
const currentTime = shallowRef(0)
const duration = shallowRef(0)
const audio = new Audio()

audio.addEventListener('ended', () => {
  isPlaying.value = false
  currentTime.value = 0
})

audio.addEventListener('pause', () => {
  isPlaying.value = false
})

audio.addEventListener('play', () => {
  isPlaying.value = true
})

audio.addEventListener('timeupdate', updateCurrentTime)
audio.addEventListener('loadedmetadata', updateDuration)
audio.addEventListener('durationchange', updateDuration)
audio.addEventListener('emptied', resetProgress)

export function useAudioPlayer() {
  const currentMaterialId = computed(() => currentMaterial.value?.id ?? null)

  async function play(material: MaterialItem) {
    if (!material.audioUrl) {
      return
    }

    if (currentMaterial.value?.id !== material.id) {
      audio.pause()
      audio.src = material.audioUrl
      audio.currentTime = 0
      currentTime.value = 0
      duration.value = 0
      currentMaterial.value = material
    }

    await audio.play()
  }

  function pause() {
    audio.pause()
  }

  async function toggle(material: MaterialItem) {
    if (currentMaterial.value?.id === material.id && isPlaying.value) {
      pause()
      return
    }

    await play(material)
  }

  function close() {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    resetProgress()
    currentMaterial.value = null
  }

  function seek(seconds: number) {
    if (!Number.isFinite(seconds)) {
      return
    }

    const nextTime = clamp(seconds, 0, Number.isFinite(audio.duration) ? audio.duration : seconds)

    audio.currentTime = nextTime
    currentTime.value = nextTime
  }

  return {
    currentMaterial: readonly(currentMaterial),
    currentMaterialId,
    currentTime: readonly(currentTime),
    duration: readonly(duration),
    isPlaying: readonly(isPlaying),
    play,
    pause,
    seek,
    toggle,
    close,
  }
}

function updateCurrentTime() {
  currentTime.value = audio.currentTime
}

function updateDuration() {
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
}

function resetProgress() {
  currentTime.value = 0
  duration.value = 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
