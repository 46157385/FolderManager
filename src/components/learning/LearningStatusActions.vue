<script setup lang="ts">
import { Check, Play, RotateCcw } from '@lucide/vue'

import type { LearningStatus } from '@/types/learning'
import LearningStatusBadge from './LearningStatusBadge.vue'

interface Props {
  status: LearningStatus
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [status: LearningStatus]
}>()
</script>

<template>
  <div class="learning-actions">
    <LearningStatusBadge :status="props.status" />

    <button
      v-if="props.status === 'not_started'"
      class="primary-action"
      type="button"
      @click="emit('change', 'in_progress')"
    >
      <Play :size="15" />
      <span>开始学习</span>
    </button>

    <button
      v-else-if="props.status === 'in_progress'"
      class="primary-action complete-action"
      type="button"
      @click="emit('change', 'completed')"
    >
      <Check :size="16" />
      <span>完成学习</span>
    </button>

    <button
      v-else
      class="primary-action"
      type="button"
      @click="emit('change', 'in_progress')"
    >
      <Play :size="15" />
      <span>重新学习</span>
    </button>

    <button
      v-if="props.status !== 'not_started'"
      class="reset-action"
      type="button"
      title="重置为未学习"
      aria-label="重置为未学习"
      @click="emit('change', 'not_started')"
    >
      <RotateCcw :size="15" />
    </button>
  </div>
</template>

<style scoped>
.learning-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-action,
.reset-action {
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
}

.primary-action {
  padding: 0 12px;
}

.primary-action:hover {
  border-color: var(--color-primary-strong);
  background: var(--color-primary-strong);
  transform: translateY(-1px);
}

.complete-action {
  border-color: var(--color-success);
  background: var(--color-success);
}

.complete-action:hover {
  border-color: #24643d;
  background: #24643d;
}

.reset-action {
  width: 36px;
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-muted-strong);
}

.reset-action:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
}

@media (max-width: 480px) {
  .learning-actions {
    flex-wrap: wrap;
  }
}
</style>
