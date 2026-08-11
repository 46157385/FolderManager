<script setup lang="ts">
import { ChevronRight, Folder } from '@lucide/vue'

interface FolderListItem {
  readonly id: string
  readonly name: string
  readonly materialIds?: readonly string[]
  readonly materialCount?: number
}

interface Props {
  folders: readonly FolderListItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [folder: FolderListItem]
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
        <span class="folder-meta">
          {{ folder.materialCount ?? folder.materialIds?.length ?? 0 }} 个资料
        </span>
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
  grid-template-columns: 52px minmax(0, 1fr) 30px;
  gap: 16px;
  align-items: center;
  min-height: 92px;
  padding: 18px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.folder-row:hover {
  border-color: var(--color-border-strong);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.folder-icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(94, 106, 210, 0.18);
  border-radius: var(--radius-md);
  background: linear-gradient(145deg, #f9f9ff, #eaeaff);
  color: var(--color-primary);
  box-shadow: 0 8px 20px rgba(94, 106, 210, 0.1);
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
  font-size: 15px;
  font-weight: 660;
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

@media (min-width: 760px) {
  .folder-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .folder-row {
    grid-template-columns: 46px minmax(0, 1fr) 24px;
    gap: 13px;
    min-height: 82px;
    padding: 15px;
  }

  .folder-icon {
    width: 46px;
    height: 46px;
  }
}
</style>
