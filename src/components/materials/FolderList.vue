<script setup lang="ts">
import { ChevronRight, Folder } from '@lucide/vue'

import type { MaterialFolder } from '@/types/material'

interface Props {
  folders: MaterialFolder[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [folder: MaterialFolder]
}>()
</script>

<template>
  <div class="folder-list">
    <button
      v-for="folder in props.folders"
      :key="folder.id"
      class="folder-row"
      type="button"
      @click="emit('open', folder)"
    >
      <span class="folder-icon">
        <Folder :size="22" />
      </span>

      <span class="folder-main">
        <span class="folder-name">{{ folder.name }}</span>
        <span class="folder-meta">{{ folder.materialIds.length }} 个资料</span>
      </span>

      <span class="folder-arrow" aria-hidden="true">
        <ChevronRight :size="18" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.folder-list {
  display: grid;
  gap: 14px;
}

.folder-row {
  display: grid;
  width: 100%;
  grid-template-columns: 48px minmax(0, 1fr) 28px;
  gap: 16px;
  align-items: center;
  min-height: 76px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.folder-row:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.folder-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
  color: var(--color-primary);
}

.folder-main {
  min-width: 0;
}

.folder-name,
.folder-meta {
  display: block;
}

.folder-name {
  color: var(--color-text-strong);
  font-weight: 620;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.folder-meta {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 13px;
}

.folder-arrow {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
}

.folder-row:hover .folder-arrow {
  color: var(--color-primary);
  transform: translateX(2px);
}
</style>
