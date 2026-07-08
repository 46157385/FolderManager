<script setup lang="ts">
import { ChevronDown, CircleX, Pause, Play } from '@lucide/vue'
import { computed, shallowRef } from 'vue'

import type { MaterialItem } from '@/types/material'
import { getMaterialTitle } from '@/utils/materialTitle'

interface Props {
  material: MaterialItem
  active: boolean
  playing: boolean
  currentTime: number
  duration: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [material: MaterialItem]
  seek: [seconds: number]
  close: []
}>()

const collapsed = shallowRef(false)

const buttonLabel = computed(() => {
  if (!props.active) {
    return '播放音频'
  }

  return props.playing ? '暂停音频' : '继续播放'
})

const collapseLabel = computed(() => collapsed.value ? '展开播放器' : '收起播放器')

const progressMax = computed(() => Math.max(props.duration, 0))
const progressValue = computed(() => props.active ? Math.min(props.currentTime, progressMax.value) : 0)
const canSeek = computed(() => props.active && progressMax.value > 0)
const progressPercent = computed(() => {
  if (!canSeek.value) {
    return 0
  }

  return Math.min((progressValue.value / progressMax.value) * 100, 100)
})

const elapsedLabel = computed(() => formatTime(progressValue.value))
const durationLabel = computed(() => formatTime(progressMax.value))
const progressLabel = computed(() => `${elapsedLabel.value} / ${durationLabel.value}`)

function handleSeek(event: Event) {
  emit('seek', Number((event.target as HTMLInputElement).value))
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00'
  }

  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <aside class="floating-player" :class="{ 'floating-player-collapsed': collapsed }">
    <button
      class="main-control"
      type="button"
      :aria-label="buttonLabel"
      :title="buttonLabel"
      @click="emit('toggle', props.material)"
    >
      <Pause v-if="props.active && props.playing" :size="22" />
      <Play v-else :size="22" />
    </button>

    <div v-show="!collapsed" class="player-meta">
      <span class="player-title">{{ getMaterialTitle(props.material) }}</span>
      <span class="player-status">{{ props.active && props.playing ? '正在播放' : '音频就绪' }}</span>

      <div class="player-progress">
        <div class="player-time">
          <span>{{ elapsedLabel }}</span>
          <span>{{ durationLabel }}</span>
        </div>

        <input
          class="progress-slider"
          type="range"
          min="0"
          step="0.1"
          :max="progressMax"
          :value="progressValue"
          :disabled="!canSeek"
          :aria-label="`调整音频进度，当前 ${progressLabel}`"
          :title="progressLabel"
          :style="{ '--progress-percent': `${progressPercent}%` }"
          @input="handleSeek"
        >
      </div>
    </div>

    <button
      class="icon-control"
      type="button"
      :aria-label="collapseLabel"
      :title="collapseLabel"
      @click="collapsed = !collapsed"
    >
      <ChevronDown :size="18" :class="{ 'rotate-icon': collapsed }" />
    </button>

    <button
      class="icon-control"
      type="button"
      aria-label="关闭播放器"
      title="关闭播放器"
      @click="emit('close')"
    >
      <CircleX :size="18" />
    </button>
  </aside>
</template>

<style scoped>
.floating-player {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 20;
  display: grid;
  grid-template-columns: 52px minmax(180px, 300px) 36px 36px;
  gap: 10px;
  align-items: center;
  max-width: calc(100vw - 48px);
  padding: 12px;
  border: 1px solid rgba(228, 231, 236, 0.92);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 64px rgba(16, 24, 40, 0.16);
  backdrop-filter: blur(18px);
}

.floating-player-collapsed {
  grid-template-columns: 52px 36px 36px;
}

.main-control,
.icon-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-strong);
  cursor: pointer;
}

.main-control {
  width: 52px;
  height: 52px;
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.2);
}

.icon-control {
  width: 36px;
  height: 36px;
  color: var(--color-muted-strong);
}

.main-control:hover,
.icon-control:hover {
  transform: translateY(-1px);
}

.icon-control:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
}

.player-meta {
  min-width: 0;
}

.player-title,
.player-status {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-title {
  color: var(--color-text-strong);
  font-size: 14px;
  font-weight: 620;
}

.player-status {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 12px;
}

.player-progress {
  margin-top: 10px;
}

.player-time {
  display: flex;
  justify-content: space-between;
  color: var(--color-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.progress-slider {
  width: 100%;
  height: 18px;
  margin: 6px 0 0;
  padding: 0;
  accent-color: var(--color-primary);
  background: transparent;
  cursor: pointer;
}

.progress-slider:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.progress-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background:
    linear-gradient(
      to right,
      var(--color-primary) 0%,
      var(--color-primary) var(--progress-percent),
      var(--color-border) var(--progress-percent),
      var(--color-border) 100%
    );
}

.progress-slider::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -5px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  appearance: none;
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.2);
}

.progress-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
}

.progress-slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--color-primary);
}

.progress-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.2);
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 160ms var(--ease-standard);
}

@media (max-width: 640px) {
  .floating-player {
    right: 12px;
    bottom: 12px;
    grid-template-columns: 48px minmax(0, 1fr) 34px 34px;
    max-width: calc(100vw - 24px);
    padding: 10px;
  }

  .main-control {
    width: 48px;
    height: 48px;
  }

  .icon-control {
    width: 34px;
    height: 34px;
  }
}
</style>
