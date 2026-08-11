<script setup lang="ts">
import { Pause, Play } from '@lucide/vue'

interface Props {
  active: boolean
  playing: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '播放音频',
})

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="play-button"
    :class="{ 'play-button-active': props.active }"
    :aria-label="props.label"
    :title="props.label"
    type="button"
    @click.stop="emit('toggle')"
  >
    <Pause v-if="props.active && props.playing" :size="18" />
    <Play v-else :size="18" />
  </button>
</template>

<style scoped>
.play-button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-text-strong);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
}

.play-button:hover {
  border-color: rgba(94, 106, 210, 0.32);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateY(-1px) scale(1.02);
}

.play-button-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(94, 106, 210, 0.2);
}
</style>
