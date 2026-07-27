<script setup lang="ts">
import { History, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'

import FolderList from '@/components/materials/FolderList.vue'
import { useScrollPosition } from '@/composables/useScrollPosition'
import { folders } from '@/data/folders'
import type { MaterialFolder } from '@/types/material'

defineOptions({ name: 'LibraryView' })

const router = useRouter()
useScrollPosition()

function openFolder(folder: MaterialFolder) {
  router.push({ name: 'folder', params: { id: folder.id } })
}
</script>

<template>
  <main class="page">
    <section class="library-shell">
      <header class="library-header">
        <div class="header-copy">
          <h1 class="title">欢迎使用</h1>
        </div>

        <div class="header-actions">
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

      <FolderList :folders="folders" @open="openFolder" />
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.library-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 64px 0 96px;
}

.library-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 32px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.header-copy {
  max-width: 680px;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 40px;
  font-weight: 680;
  line-height: 1.08;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.toolbar-button {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.toolbar-button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .library-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 32px 0 56px;
  }

  .library-header {
    display: grid;
    gap: 20px;
  }

  .title {
    font-size: 32px;
  }
}
</style>
