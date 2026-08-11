<script setup lang="ts">
import type { LearningStatusFilter } from '@/types/learning'

const selectedStatus = defineModel<LearningStatusFilter>({ required: true })

const filterOptions: Array<{ value: LearningStatusFilter, label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'not_started', label: '未学习' },
  { value: 'in_progress', label: '学习中' },
  { value: 'completed', label: '已学习' },
]
</script>

<template>
  <div class="status-filter" role="group" aria-label="按学习状态筛选">
    <button
      v-for="option in filterOptions"
      :key="option.value"
      class="filter-button"
      :class="[
        `filter-${option.value}`,
        { 'filter-button-active': selectedStatus === option.value },
      ]"
      type="button"
      :aria-pressed="selectedStatus === option.value"
      @click="selectedStatus = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.status-filter {
  display: flex;
  width: fit-content;
  max-width: 100%;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-panel);
  overflow-x: auto;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.filter-button {
  min-width: 72px;
  height: 36px;
  padding: 0 13px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-muted-strong);
  cursor: pointer;
  font-size: 13px;
  font-weight: 620;
  white-space: nowrap;
}

.filter-button:hover {
  background: var(--color-surface-subtle);
  color: var(--color-text-strong);
}

.filter-button-active {
  background: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 5px 14px rgba(94, 106, 210, 0.22);
}

.filter-button-active:hover {
  background: var(--color-primary-strong);
  color: #ffffff;
}

.filter-not_started.filter-button-active,
.filter-not_started.filter-button-active:hover {
  background: var(--color-muted-strong);
}

.filter-in_progress.filter-button-active,
.filter-in_progress.filter-button-active:hover {
  background: var(--color-warning);
  box-shadow: 0 5px 14px rgba(155, 107, 18, 0.2);
}

.filter-completed.filter-button-active,
.filter-completed.filter-button-active:hover {
  background: var(--color-success);
  box-shadow: 0 5px 14px rgba(45, 122, 75, 0.2);
}

@media (max-width: 480px) {
  .status-filter {
    width: 100%;
  }

  .filter-button {
    min-width: 66px;
    flex: 1 0 auto;
  }
}
</style>
