<script setup lang="ts">
import { CheckCircle2, Circle, Clock3 } from '@lucide/vue'
import { computed } from 'vue'

import type { LearningStatus } from '@/types/learning'

interface Props {
  status: LearningStatus
}

const props = defineProps<Props>()

const statusLabel = computed(() => {
  if (props.status === 'in_progress') {
    return '学习中'
  }

  if (props.status === 'completed') {
    return '已学习'
  }

  return '未学习'
})
</script>

<template>
  <span class="status-badge" :class="`status-${props.status}`">
    <Clock3 v-if="props.status === 'in_progress'" :size="14" />
    <CheckCircle2 v-else-if="props.status === 'completed'" :size="14" />
    <Circle v-else :size="14" />
    <span>{{ statusLabel }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  min-width: 76px;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
}

.status-not_started {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-muted-strong);
}

.status-in_progress {
  border-color: rgba(155, 107, 18, 0.22);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.status-completed {
  border-color: rgba(45, 122, 75, 0.2);
  background: var(--color-success-soft);
  color: var(--color-success);
}
</style>
