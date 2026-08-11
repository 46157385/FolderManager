<script setup lang="ts">
import { AlertCircle, ArrowLeft, FolderOpen, ListTree, LoaderCircle, RefreshCw } from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import LearningStatusActions from '@/components/learning/LearningStatusActions.vue'
import CatalogStatePanel from '@/components/materials/CatalogStatePanel.vue'
import FavoriteButton from '@/components/materials/FavoriteButton.vue'
import FloatingAudioPlayer from '@/components/materials/FloatingAudioPlayer.vue'
import SectionOutlineDrawer from '@/components/outlines/SectionOutlineDrawer.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useCatalog } from '@/composables/useCatalog'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { useLearningStatus } from '@/composables/useLearningStatus'
import { useMaterialStats } from '@/composables/useMaterialStats'
import { usePdfPreview } from '@/composables/usePdfPreview'
import { useViewHistory } from '@/composables/useViewHistory'
import { getMaterialTitle } from '@/utils/materialTitle'
import type { LearningStatus } from '@/types/learning'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const isSummaryOpen = shallowRef(false)
const {
  materialById,
  isLoading: isCatalogLoading,
  isLoaded: isCatalogLoaded,
  errorMessage: catalogErrorMessage,
  loadCatalog,
} = useCatalog()
const material = computed(() => materialById.value.get(props.id))
const materialTitle = computed(() => material.value ? getMaterialTitle(material.value) : '')
const materialPdfUrl = computed(() => material.value?.pdfUrl)
const materialFolderId = computed(() => material.value?.folderId ?? 'wwg-season-5')
const materialCollection = computed(() => material.value?.collection ?? 'session5')
const { currentMaterialId, currentTime, duration, isPlaying, toggle, seek, close } = useAudioPlayer()
const { isFavorite, toggleFavorite } = useFavoriteMaterials()
const { getLearningStatus, setLearningStatus } = useLearningStatus()
const {
  previewUrl,
  isLoading: isPdfLoading,
  errorMessage: pdfErrorMessage,
  retry: retryPdf,
} = usePdfPreview(materialPdfUrl)
const { viewCount, recordView } = useMaterialStats(props.id)
const { recordHistory } = useViewHistory()
const learningStatus = computed(() => {
  return material.value ? getLearningStatus(material.value.id) : 'not_started'
})
let recordedMaterialId = ''

watch(
  [material, isCatalogLoaded],
  ([currentMaterial, catalogLoaded]) => {
    if (currentMaterial && recordedMaterialId !== currentMaterial.id) {
      isSummaryOpen.value = false
      recordedMaterialId = currentMaterial.id
      recordView(currentMaterial.id)
      recordHistory(currentMaterial)
      return
    }

    if (catalogLoaded && !currentMaterial) {
      void router.replace({ name: 'library' })
    }
  },
  { immediate: true },
)

function retryCatalog() {
  void loadCatalog(true)
}

function changeLearningStatus(status: LearningStatus) {
  if (material.value) {
    setLearningStatus(material.value.id, status)
  }
}

async function revealInFinder() {
  if (!material.value) {
    return
  }

  const query = new URLSearchParams({
    materialId: material.value.id,
    collection: material.value.collection ?? 'session5',
  })
  const response = await fetch(`/api/reveal-in-finder?${query}`)

  if (!response.ok) {
    window.alert('无法在 Finder 中打开文件位置')
  }
}

function returnToList() {
  const previousPath = window.history.state?.back

  if (typeof previousPath === 'string' && isListPath(previousPath)) {
    router.back()
    return
  }

  router.replace({ name: 'folder', params: { id: materialFolderId.value } })
}

function isListPath(path: string) {
  return /^\/(?:folders\/[^/?#]+|favorites|history)(?:[/?#]|$)/.test(path)
}
</script>

<template>
  <main class="reader-page">
    <section v-if="isCatalogLoading || catalogErrorMessage" class="catalog-state-wrap">
      <CatalogStatePanel
        :loading="isCatalogLoading"
        :error-message="catalogErrorMessage"
        @retry="retryCatalog"
      />
    </section>

    <template v-else-if="material">
      <header class="reader-header">
        <button
          class="back-link"
          type="button"
          title="返回列表"
          aria-label="返回列表"
          @click="returnToList"
        >
          <ArrowLeft :size="19" />
        </button>

        <div class="reader-title-wrap">
          <h1 class="reader-title">{{ materialTitle }}</h1>
          <p class="reader-meta">浏览量 {{ viewCount }}</p>
        </div>

        <LearningStatusActions
          class="reader-learning-actions"
          :status="learningStatus"
          @change="changeLearningStatus"
        />

        <div class="reader-actions">
          <button
            class="reader-action-button reader-outline-button"
            type="button"
            title="查看本文总结与大纲"
            aria-label="查看本文总结与大纲"
            @click="isSummaryOpen = true"
          >
            <ListTree :size="17" />
            <span>文章大纲</span>
          </button>

          <button
            class="reader-action-button"
            type="button"
            title="在 Finder 中显示"
            aria-label="在 Finder 中显示"
            @click="revealInFinder"
          >
            <FolderOpen :size="18" />
          </button>

          <FavoriteButton
            :active="isFavorite(material.id)"
            @toggle="toggleFavorite(material.id)"
          />
        </div>
      </header>

      <section class="pdf-wrap">
        <div v-if="isPdfLoading" class="pdf-state" aria-live="polite">
          <LoaderCircle class="pdf-state-spinner" :size="24" />
          <span>正在加载 PDF...</span>
        </div>

        <iframe
          v-else-if="previewUrl"
          class="pdf-frame"
          :src="previewUrl"
          title="PDF 阅读器"
        />

        <div v-else class="pdf-state pdf-state-error" role="alert">
          <AlertCircle :size="24" />
          <span>{{ pdfErrorMessage }}</span>
          <button class="pdf-retry-button" type="button" @click="retryPdf">
            <RefreshCw :size="16" />
            <span>重新加载</span>
          </button>
        </div>
      </section>

      <FloatingAudioPlayer
        v-if="material.audioUrl"
        :material="material"
        :active="currentMaterialId === material.id"
        :playing="currentMaterialId === material.id && isPlaying"
        :current-time="currentTime"
        :duration="duration"
        @toggle="toggle"
        @seek="seek"
        @close="close"
      />
    </template>

    <SectionOutlineDrawer
      v-if="material"
      :open="isSummaryOpen"
      resource-type="material"
      :collection="materialCollection"
      :material-id="material.id"
      :section-title="materialTitle"
      @close="isSummaryOpen = false"
    />
  </main>
</template>

<style scoped>
.reader-page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.catalog-state-wrap {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 56px 0 96px;
}

.reader-header {
  position: sticky;
  top: var(--app-toolbar-height);
  z-index: 10;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto auto;
  gap: 16px;
  align-items: center;
  min-height: 76px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(24, 24, 27, 0.09);
  background: rgba(250, 250, 251, 0.78);
  backdrop-filter: saturate(150%) blur(22px);
  -webkit-backdrop-filter: saturate(150%) blur(22px);
  box-shadow: 0 1px 8px rgba(24, 24, 27, 0.04);
}

.back-link {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.76);
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

.reader-title-wrap {
  min-width: 0;
}

.reader-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 680;
  letter-spacing: -0.015em;
  line-height: 1.35;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.reader-meta {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  margin: 8px 0 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  color: var(--color-muted-strong);
  font-size: 13px;
  padding: 0 10px;
}

.reader-actions {
  display: flex;
  gap: 10px;
  justify-self: end;
}

.reader-learning-actions {
  justify-self: end;
}

.reader-action-button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
}

.reader-action-button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.reader-outline-button {
  width: auto;
  gap: 7px;
  padding: 0 12px;
  color: var(--color-primary-strong);
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}

.pdf-wrap {
  height: calc(100vh - var(--app-toolbar-height) - 76px);
  padding: 20px;
}

.pdf-state {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  color: var(--color-muted-strong);
  box-shadow: var(--shadow-soft);
}

.pdf-state-error {
  flex-direction: column;
  color: var(--color-danger, #b42318);
  text-align: center;
}

.pdf-state-spinner {
  animation: pdf-spin 0.8s linear infinite;
}

.pdf-retry-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-strong);
  cursor: pointer;
}

.pdf-retry-button:hover {
  background: var(--color-bg-elevated);
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

@keyframes pdf-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .reader-header {
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 10px 12px;
  }

  .reader-learning-actions {
    grid-column: 2;
    justify-self: start;
  }

  .pdf-wrap {
    height: calc(100vh - var(--app-toolbar-height) - 76px);
    padding: 10px;
  }

  .reader-actions {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
