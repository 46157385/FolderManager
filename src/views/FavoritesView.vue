<script setup lang="ts">
import { ArrowDownAZ, ArrowLeft, ArrowUpZA, Star } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import LearningStatusFilter from '@/components/learning/LearningStatusFilter.vue'
import CatalogStatePanel from '@/components/materials/CatalogStatePanel.vue'
import MaterialList from '@/components/materials/MaterialList.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useCatalog } from '@/composables/useCatalog'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { useLearningStatus } from '@/composables/useLearningStatus'
import { useScrollPosition } from '@/composables/useScrollPosition'
import type { LearningStatusFilter as LearningStatusFilterValue } from '@/types/learning'
import type { MaterialItem } from '@/types/material'

defineOptions({ name: 'FavoritesView' })

const router = useRouter()
const sortDirection = shallowRef<'asc' | 'desc'>('asc')
const learningStatusFilter = shallowRef<LearningStatusFilterValue>('all')
const { currentMaterialId, isPlaying, toggle } = useAudioPlayer()
const { materials, isLoading, isLoaded, errorMessage, loadCatalog } = useCatalog()
const { favoriteIds, isFavorite, toggleFavorite } = useFavoriteMaterials()
const { getLearningStatus } = useLearningStatus()
const { saveScrollPosition } = useScrollPosition()

const catalogLoading = computed(() => {
  return isLoading.value || (!isLoaded.value && !errorMessage.value)
})
const favoriteMaterials = computed(() => {
  const ids = new Set(favoriteIds.value)
  return materials.value.filter((material) => ids.has(material.id))
})
const visibleFavoriteMaterials = computed(() => {
  if (learningStatusFilter.value === 'all') {
    return favoriteMaterials.value
  }

  return favoriteMaterials.value.filter((material) => {
    return getLearningStatus(material.id) === learningStatusFilter.value
  })
})

const sortLabel = computed(() => sortDirection.value === 'asc' ? '按名称升序' : '按名称降序')

function openMaterial(material: MaterialItem) {
  saveScrollPosition()
  router.push({ name: 'reader', params: { id: material.id } })
}

function toggleSort() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

function retryCatalog() {
  void loadCatalog(true)
}
</script>

<template>
  <main class="page">
    <section class="favorites-shell">
      <header class="favorites-header">
        <RouterLink class="back-link" :to="{ name: 'library' }" title="返回列表" aria-label="返回列表">
          <ArrowLeft :size="19" />
        </RouterLink>

        <div class="title-wrap">
          <p class="eyebrow">Favorites</p>
          <h1 class="title">已收藏</h1>
          <p class="description">{{ favoriteMaterials.length }} 个资料已收藏。</p>
        </div>

        <button class="toolbar-button" type="button" :title="sortLabel" :aria-label="sortLabel" @click="toggleSort">
          <ArrowDownAZ v-if="sortDirection === 'asc'" :size="19" />
          <ArrowUpZA v-else :size="19" />
        </button>
      </header>

      <CatalogStatePanel
        v-if="catalogLoading || errorMessage"
        :loading="catalogLoading"
        :error-message="errorMessage"
        @retry="retryCatalog"
      />

      <template v-else>
        <section v-if="favoriteMaterials.length === 0" class="empty-state">
          <span class="empty-icon">
            <Star :size="22" />
          </span>
          <p class="empty-title">暂无收藏</p>
          <p class="empty-text">在列表或阅读页点击星号后，会出现在这里。</p>
        </section>

        <template v-else>
          <LearningStatusFilter
            v-model="learningStatusFilter"
            class="learning-status-filter"
          />

          <section v-if="visibleFavoriteMaterials.length === 0" class="empty-state">
            <span class="empty-icon">
              <Star :size="22" />
            </span>
            <p class="empty-title">当前状态暂无收藏</p>
            <p class="empty-text">切换到其他学习状态，即可继续查看收藏资料。</p>
          </section>

          <MaterialList
            v-else
            :materials="visibleFavoriteMaterials"
            :current-material-id="currentMaterialId"
            :is-playing="isPlaying"
            :sort-direction="sortDirection"
            :is-favorite="isFavorite"
            :get-learning-status="getLearningStatus"
            @open="openMaterial"
            @toggle-audio="toggle"
            @toggle-favorite="toggleFavorite"
          />
        </template>
      </template>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.favorites-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 44px 0 96px;
}

.favorites-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 18px;
  align-items: center;
  margin-bottom: 22px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.learning-status-filter {
  margin-bottom: 22px;
}

.back-link,
.toolbar-button {
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

.back-link:hover,
.toolbar-button:hover {
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
}

.description {
  margin: 12px 0 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.65;
}

.empty-state {
  display: grid;
  justify-items: center;
  padding: 56px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  text-align: center;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(16px);
}

.empty-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(154, 103, 0, 0.18);
  border-radius: var(--radius-md);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.empty-title {
  margin: 16px 0 6px;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 620;
}

.empty-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .favorites-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 24px 0 56px;
  }

  .favorites-header {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 12px;
    padding: 20px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
