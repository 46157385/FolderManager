<script setup lang="ts">
import { ArrowDownAZ, ArrowLeft, ArrowUpZA, Star } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import MaterialList from '@/components/materials/MaterialList.vue'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useFavoriteMaterials } from '@/composables/useFavoriteMaterials'
import { useScrollPosition } from '@/composables/useScrollPosition'
import { materials } from '@/data/materials'
import type { MaterialItem } from '@/types/material'

defineOptions({ name: 'FavoritesView' })

const router = useRouter()
const sortDirection = shallowRef<'asc' | 'desc'>('asc')
const { currentMaterialId, isPlaying, toggle } = useAudioPlayer()
const { favoriteIds, isFavorite, toggleFavorite } = useFavoriteMaterials()
const { saveScrollPosition } = useScrollPosition()

const favoriteMaterials = computed(() => {
  const ids = new Set(favoriteIds.value)
  return materials.filter((material) => ids.has(material.id))
})

const sortLabel = computed(() => sortDirection.value === 'asc' ? '按名称升序' : '按名称降序')

function openMaterial(material: MaterialItem) {
  saveScrollPosition()
  router.push({ name: 'reader', params: { id: material.id } })
}

function toggleSort() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
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

      <section v-if="favoriteMaterials.length === 0" class="empty-state">
        <span class="empty-icon">
          <Star :size="22" />
        </span>
        <p class="empty-title">暂无收藏</p>
        <p class="empty-text">在列表或阅读页点击星号后，会出现在这里。</p>
      </section>

      <MaterialList
        v-else
        :materials="favoriteMaterials"
        :current-material-id="currentMaterialId"
        :is-playing="isPlaying"
        :sort-direction="sortDirection"
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

.favorites-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 56px 0 96px;
}

.favorites-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
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
  background: var(--color-surface);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
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
  background: var(--color-surface);
  text-align: center;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
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
    padding: 32px 0 56px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
