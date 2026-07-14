<script setup lang="ts">
import { ArrowLeft, FolderOpen } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import FavoriteButton from '@/components/materials/FavoriteButton.vue'
import FloatingAudioPlayer from '@/components/materials/FloatingAudioPlayer.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { useMaterialStats } from '@/composables/useMaterialStats'
import { useViewHistory } from '@/composables/useViewHistory'
import { defaultFolderId, folders } from '@/data/folders'
import { materials } from '@/data/materials'
import { getMaterialTitle } from '@/utils/materialTitle'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const material = computed(() => materials.find((item) => item.id === props.id))
const materialTitle = computed(() => material.value ? getMaterialTitle(material.value) : '')
const materialFolderId = computed(() => {
  return folders.find((folder) => folder.materialIds.includes(props.id))?.id ?? defaultFolderId
})
const { currentMaterialId, currentTime, duration, isPlaying, toggle, seek, close } = useAudioPlayer()
const { isFavorite, toggleFavorite } = useFavoriteMaterials()
const { viewCount, recordView } = useMaterialStats(props.id)
const { recordHistory } = useViewHistory()

onMounted(() => {
  if (!material.value) {
    router.replace({ name: 'library' })
    return
  }

  recordView(material.value.id)
  recordHistory(material.value)
})

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
</script>

<template>
  <main v-if="material" class="reader-page">
    <header class="reader-header">
      <RouterLink
        class="back-link"
        :to="{ name: 'folder', params: { id: materialFolderId } }"
        title="返回文件夹"
        aria-label="返回文件夹"
      >
        <ArrowLeft :size="19" />
      </RouterLink>

      <div class="reader-title-wrap">
        <h1 class="reader-title">{{ materialTitle }}</h1>
        <p class="reader-meta">浏览量 {{ viewCount }}</p>
      </div>

      <div class="reader-actions">
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
      <iframe class="pdf-frame" :src="material.pdfUrl" title="PDF 阅读器" />
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
  </main>
</template>

<style scoped>
.reader-page {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.reader-header {
  position: sticky;
  top: var(--app-toolbar-height);
  z-index: 10;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  min-height: 76px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(228, 231, 236, 0.86);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
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
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
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
  font-weight: 650;
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
  background: var(--color-surface-subtle);
  color: var(--color-muted-strong);
  font-size: 13px;
  padding: 0 10px;
}

.reader-actions {
  display: flex;
  gap: 10px;
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
  background: var(--color-surface);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.reader-action-button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.pdf-wrap {
  height: calc(100vh - var(--app-toolbar-height) - 76px);
  padding: 20px;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

@media (max-width: 640px) {
  .reader-header {
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 10px 12px;
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
