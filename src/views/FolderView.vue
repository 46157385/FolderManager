<script setup lang="ts">
import { ArrowLeft, Search, X } from '@lucide/vue'
import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import SectionedMaterialList from '@/components/materials/SectionedMaterialList.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { folders, thinkingFolderId } from '@/data/folders'
import { materials } from '@/data/materials'
import { season5Sections } from '@/data/season5Sections'
import { thinkingSections } from '@/data/thinkingMaterials'
import type { MaterialItem } from '@/types/material'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const searchQuery = shallowRef('')
const { currentMaterialId, isPlaying, toggle } = useAudioPlayer()
const { isFavorite, toggleFavorite } = useFavoriteMaterials()

const folder = computed(() => folders.find((item) => item.id === props.id))
const folderSections = computed(() => props.id === thinkingFolderId ? thinkingSections : season5Sections)
const folderMaterials = computed(() => {
  const ids = new Set(folder.value?.materialIds ?? [])
  return materials.filter((material) => ids.has(material.id))
})

onMounted(() => {
  if (!folder.value) {
    router.replace({ name: 'library' })
  }
})

function openMaterial(material: MaterialItem) {
  router.push({ name: 'reader', params: { id: material.id } })
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <main v-if="folder" class="page">
    <section class="folder-shell">
      <header class="folder-header">
        <RouterLink class="back-link" :to="{ name: 'library' }" title="返回文件夹列表">
          <ArrowLeft :size="19" />
        </RouterLink>

        <div class="title-wrap">
          <p class="eyebrow">Folder</p>
          <h1 class="title">{{ folder.name }}</h1>
          <p class="description">{{ folderMaterials.length }} 个资料，按章节分组浏览。</p>
        </div>
      </header>

      <div class="search-wrap">
        <Search class="search-icon" :size="18" />
        <input
          v-model="searchQuery"
          class="search-input"
          type="search"
          placeholder="搜索标题"
          aria-label="搜索标题"
        >
        <button
          v-if="searchQuery"
          class="clear-search-button"
          type="button"
          title="清空搜索"
          aria-label="清空搜索"
          @click="clearSearch"
        >
          <X :size="17" />
        </button>
      </div>

      <SectionedMaterialList
        :materials="folderMaterials"
        :sections="folderSections"
        :search-query="searchQuery"
        :current-material-id="currentMaterialId"
        :is-playing="isPlaying"
        :is-favorite="isFavorite"
        @open="openMaterial"
        @toggle-audio="toggle"
        @toggle-favorite="toggleFavorite"
      />
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.folder-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 56px 0 96px;
}

.folder-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.search-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.search-wrap:focus-within {
  border-color: rgba(37, 99, 235, 0.42);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

.search-icon {
  justify-self: center;
  color: var(--color-muted);
}

.search-input {
  width: 100%;
  min-width: 0;
  height: 52px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
}

.search-input::placeholder {
  color: var(--color-muted);
}

.clear-search-button {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  justify-self: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.clear-search-button:hover {
  border-color: var(--color-border);
  background: var(--color-surface-subtle);
  color: var(--color-text-strong);
}

.back-link {
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

.back-link:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.title-wrap {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 38px;
  font-weight: 680;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.description {
  margin: 12px 0 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.65;
}

@media (max-width: 640px) {
  .folder-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 32px 0 56px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
