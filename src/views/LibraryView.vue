<script setup lang="ts">
import { History, MessageCircleMore, Star } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import CatalogStatePanel from '@/components/materials/CatalogStatePanel.vue'
import FolderList from '@/components/materials/FolderList.vue'
import { useCatalog } from '@/composables/useCatalog'
import { useScrollPosition } from '@/composables/useScrollPosition'

defineOptions({ name: 'LibraryView' })

const router = useRouter()
const { folders, isLoading, isLoaded, errorMessage, loadCatalog } = useCatalog()
const catalogLoading = computed(() => {
  return isLoading.value || (!isLoaded.value && !errorMessage.value)
})

useScrollPosition()

function openFolder(folder: { readonly id: string }) {
  router.push({ name: 'folder', params: { id: folder.id } })
}

function retryCatalog() {
  void loadCatalog(true)
}
</script>

<template>
  <main class="page">
    <section class="library-shell">
      <header class="library-header">
        <div class="header-copy">
          <p class="eyebrow">Folder Manager · 资料库</p>
          <h1 class="title">欢迎使用</h1>
          <p class="subtitle">集中整理学习资料，从熟悉的位置继续阅读。</p>
        </div>

        <div class="header-actions">
          <span v-if="!catalogLoading && !errorMessage" class="folder-count">
            {{ folders.length }} 个文件夹
          </span>
          <button
            class="knowledge-button"
            type="button"
            title="打开权力七规则 AI 问答"
            @click="router.push({ name: 'knowledge-power-seven-rules' })"
          >
            <MessageCircleMore :size="17" />
            <span>AI 问答</span>
          </button>
          <button
            class="toolbar-button"
            type="button"
            title="查看收藏"
            aria-label="查看收藏"
            @click="router.push({ name: 'favorites' })"
          >
            <Star :size="19" />
          </button>
          <button
            class="toolbar-button"
            type="button"
            title="查看历史"
            aria-label="查看历史"
            @click="router.push({ name: 'history' })"
          >
            <History :size="19" />
          </button>
        </div>
      </header>

      <CatalogStatePanel
        v-if="catalogLoading || errorMessage"
        :loading="catalogLoading"
        :error-message="errorMessage"
        @retry="retryCatalog"
      />

      <FolderList v-else :folders="folders" @open="openFolder" />
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.library-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 48px 0 96px;
}

.library-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 28px;
  padding: 32px 34px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 22px;
  background:
    radial-gradient(circle at 82% 0%, rgba(94, 106, 210, 0.16), transparent 17rem),
    var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.header-copy {
  max-width: 680px;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 42px;
  font-weight: 720;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.subtitle {
  margin: 14px 0 0;
  color: var(--color-muted-strong);
  font-size: 14px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.folder-count {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(94, 106, 210, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-muted-strong);
  font-size: 12px;
  font-weight: 620;
  white-space: nowrap;
}

.toolbar-button {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(24, 24, 27, 0.1);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
}

.knowledge-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 14px;
  border: 1px solid rgba(94, 106, 210, 0.22);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  cursor: pointer;
  font-size: 12px;
  font-weight: 680;
}

.knowledge-button:hover {
  border-color: rgba(94, 106, 210, 0.35);
  background: #e7e8ff;
  transform: translateY(-1px);
}

.toolbar-button:hover {
  border-color: var(--color-border-strong);
  background: #ffffff;
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .library-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 24px 0 56px;
  }

  .library-header {
    display: grid;
    gap: 24px;
    padding: 24px;
  }

  .title {
    font-size: 32px;
  }

  .header-actions {
    justify-content: flex-start;
  }
}
</style>
