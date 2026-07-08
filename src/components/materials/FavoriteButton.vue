<script setup lang="ts">
import { Star } from '@lucide/vue'

interface Props {
  active: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="favorite-button"
    :class="{ 'favorite-button-active': props.active }"
    :aria-label="props.active ? '取消收藏' : '收藏'"
    :title="props.active ? '取消收藏' : '收藏'"
    type="button"
    @click.stop="emit('toggle')"
  >
    <Star :size="19" :fill="props.active ? 'currentColor' : 'none'" />
  </button>
</template>

<style scoped>
.favorite-button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-muted);
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.favorite-button:hover {
  border-color: rgba(154, 103, 0, 0.32);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  transform: translateY(-1px);
}

.favorite-button-active {
  border-color: rgba(154, 103, 0, 0.28);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
</style>
