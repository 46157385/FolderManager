<script setup lang="ts">
import { ArrowLeft, Search, X } from '@lucide/vue'
import { computed, onDeactivated, shallowRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import LearningStatusFilter from '@/components/learning/LearningStatusFilter.vue'
import CatalogStatePanel from '@/components/materials/CatalogStatePanel.vue'
import SectionedMaterialList from '@/components/materials/SectionedMaterialList.vue'
import SectionOutlineDrawer from '@/components/outlines/SectionOutlineDrawer.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useCatalog } from '@/composables/useCatalog'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { useLearningStatus } from '@/composables/useLearningStatus'
import { useScrollPosition } from '@/composables/useScrollPosition'
import { thinkingFolderId } from '@/data/folders'
import { season5Sections } from '@/data/season5Sections'
import { thinkingSections } from '@/data/thinkingMaterials'
import type { LearningStatusFilter as LearningStatusFilterValue } from '@/types/learning'
import type { MaterialItem } from '@/types/material'

defineOptions({ name: 'FolderView' })

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const searchQuery = shallowRef('')
const learningStatusFilter = shallowRef<LearningStatusFilterValue>('all')
const selectedOutlineSectionId = shallowRef<string | null>(null)
const { currentMaterialId, isPlaying, toggle } = useAudioPlayer()
const {
  folders,
  materials,
  isLoading,
  isLoaded,
  errorMessage,
  loadCatalog,
} = useCatalog()
const { isFavorite, toggleFavorite } = useFavoriteMaterials()
const { getLearningStatus } = useLearningStatus()
const { saveScrollPosition } = useScrollPosition()

const folder = computed(() => folders.value.find((item) => item.id === props.id))
const folderSections = computed(() => props.id === thinkingFolderId ? thinkingSections : season5Sections)
const outlineCollection = computed(() => props.id === thinkingFolderId ? 'thinking' : 'session5')
const selectedOutlineSection = computed(() => {
  return folderSections.value.find((section) => section.id === selectedOutlineSectionId.value)
})
const folderMaterials = computed(() => {
  const legacyIds = new Set(folder.value?.materialIds ?? [])

  return materials.value.filter((material) => {
    return material.folderId === props.id || legacyIds.has(material.id)
  })
})

watch(
  [isLoaded, folder],
  ([catalogLoaded, currentFolder]) => {
    if (catalogLoaded && !currentFolder) {
      void router.replace({ name: 'library' })
    }
  },
  { immediate: true },
)

function retryCatalog() {
  void loadCatalog(true)
}

onDeactivated(() => {
  if (selectedOutlineSectionId.value) {
    closeSectionOutline()
  }
})

function openMaterial(material: MaterialItem) {
  saveScrollPosition()
  router.push({ name: 'reader', params: { id: material.id } })
}

function clearSearch() {
  searchQuery.value = ''
}

function openSectionOutline(sectionId: string) {
  if (folderSections.value.some((section) => section.id === sectionId)) {
    selectedOutlineSectionId.value = sectionId
  }
}

function closeSectionOutline() {
  selectedOutlineSectionId.value = null
}
</script>

<template>
  <main class="page">
    <section class="folder-shell">
      <CatalogStatePanel
        v-if="isLoading || errorMessage"
        :loading="isLoading"
        :error-message="errorMessage"
        @retry="retryCatalog"
      />

      <template v-else-if="folder">
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

        <LearningStatusFilter
          v-model="learningStatusFilter"
          class="learning-status-filter"
        />

        <SectionedMaterialList
          :materials="folderMaterials"
          :sections="folderSections"
          :search-query="searchQuery"
          :current-material-id="currentMaterialId"
          :is-playing="isPlaying"
          :is-favorite="isFavorite"
          :learning-status-filter="learningStatusFilter"
          :get-learning-status="getLearningStatus"
          @open="openMaterial"
          @open-outline="openSectionOutline"
          @toggle-audio="toggle"
          @toggle-favorite="toggleFavorite"
        />
      </template>
    </section>

    <SectionOutlineDrawer
      v-if="folder && selectedOutlineSection"
      :open="true"
      :collection="outlineCollection"
      :section-id="selectedOutlineSection.id"
      :section-title="selectedOutlineSection.title"
      @close="closeSectionOutline"
    />
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.folder-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 44px 0 96px;
}

.folder-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.search-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  margin-bottom: 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.learning-status-filter {
  margin-bottom: 22px;
}

.search-wrap:focus-within {
  border-color: rgba(94, 106, 210, 0.46);
  box-shadow: 0 0 0 4px rgba(94, 106, 210, 0.09), var(--shadow-panel);
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
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
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
  margin: 0 0 9px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 36px;
  font-weight: 720;
  letter-spacing: -0.035em;
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
    padding: 24px 0 56px;
  }

  .folder-header {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 14px;
    padding: 20px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
