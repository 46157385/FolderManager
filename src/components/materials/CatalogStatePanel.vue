<script setup lang="ts">
import { AlertCircle, LoaderCircle, RefreshCw } from '@lucide/vue'

interface Props {
  loading: boolean
  errorMessage: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="catalog-state" :class="{ 'catalog-state-error': props.errorMessage }">
    <LoaderCircle v-if="props.loading" class="state-spinner" :size="24" />
    <AlertCircle v-else :size="24" />

    <p class="state-message">
      {{ props.loading ? '正在从后端加载资料目录…' : props.errorMessage }}
    </p>

    <button
      v-if="!props.loading && props.errorMessage"
      class="retry-button"
      type="button"
      @click="emit('retry')"
    >
      <RefreshCw :size="16" />
      <span>重新加载</span>
    </button>
  </section>
</template>

<style scoped>
.catalog-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  align-content: center;
  gap: 12px;
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  color: var(--color-muted-strong);
  text-align: center;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.catalog-state-error {
  color: var(--color-danger, #b42318);
}

.state-message {
  margin: 0;
  line-height: 1.6;
}

.retry-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text-strong);
  cursor: pointer;
}

.retry-button:hover {
  background: var(--color-bg-elevated);
}

.state-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
