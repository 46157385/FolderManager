<script setup lang="ts">
import { ChevronDown, ChevronRight, ListTree, Search } from '@lucide/vue'
import { computed, shallowRef } from 'vue'

import LearningStatusBadge from '@/components/learning/LearningStatusBadge.vue'
import type { LearningStatus, LearningStatusFilter } from '@/types/learning'
import type { MaterialItem, MaterialSection } from '@/types/material'
import { getMaterialTitle } from '@/utils/materialTitle'
import FavoriteButton from './FavoriteButton.vue'
import PlayButton from './PlayButton.vue'

interface Props {
  materials: MaterialItem[]
  sections: MaterialSection[]
  searchQuery: string
  currentMaterialId: string | null
  isPlaying: boolean
  isFavorite: (materialId: string) => boolean
  learningStatusFilter: LearningStatusFilter
  getLearningStatus: (materialId: string) => LearningStatus
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [material: MaterialItem]
  openOutline: [sectionId: string]
  toggleAudio: [material: MaterialItem]
  toggleFavorite: [materialId: string]
}>()

const collapsedSectionIds = shallowRef<Set<string>>(new Set())

const materialMap = computed(() => {
  return new Map(props.materials.map((material) => [material.id, material]))
})

const normalizedSearchQuery = computed(() => normalizeSearchText(props.searchQuery))

const visibleSections = computed(() => {
  return props.sections
    .map((section) => {
      const sectionMatches = normalizeSearchText(section.title).includes(normalizedSearchQuery.value)
      const sectionMaterials = section.materialIds
        .map((materialId) => materialMap.value.get(materialId))
        .filter((material): material is MaterialItem => Boolean(material))
        .filter((material) => {
          return props.learningStatusFilter === 'all'
            || props.getLearningStatus(material.id) === props.learningStatusFilter
        })
        .filter((material) => {
          if (!normalizedSearchQuery.value || sectionMatches) {
            return true
          }

          return [
            getMaterialTitle(material),
            material.name,
          ].some((text) => normalizeSearchText(text).includes(normalizedSearchQuery.value))
        })

      return {
        ...section,
        materials: sectionMaterials,
      }
    })
    .filter((section) => section.materials.length > 0)
})

const totalVisibleMaterials = computed(() => {
  return visibleSections.value.reduce((total, section) => total + section.materials.length, 0)
})

const emptyText = computed(() => {
  if (normalizedSearchQuery.value && props.learningStatusFilter !== 'all') {
    return '当前状态下没有匹配标题的资料，可以更换状态或搜索关键词。'
  }

  if (normalizedSearchQuery.value) {
    return '换一个关键词，或清空搜索后查看全部章节。'
  }

  return '当前状态下暂无资料，可以切换到其他学习状态。'
})

function normalizeSearchText(text: string) {
  return text
    .replace(/[「」《》]/g, '')
    .replace(/[：:，,？?（）()·・]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

function isCollapsed(sectionId: string) {
  return collapsedSectionIds.value.has(sectionId)
}

function toggleSection(sectionId: string) {
  const nextIds = new Set(collapsedSectionIds.value)
  if (nextIds.has(sectionId)) {
    nextIds.delete(sectionId)
  } else {
    nextIds.add(sectionId)
  }
  collapsedSectionIds.value = nextIds
}
</script>

<template>
  <div class="sectioned-list">
    <section v-if="totalVisibleMaterials === 0" class="empty-search" aria-live="polite">
      <span class="empty-icon">
        <Search :size="22" />
      </span>
      <p class="empty-title">没有找到匹配资料</p>
      <p class="empty-text">{{ emptyText }}</p>
    </section>

    <section
      v-for="section in visibleSections"
      :key="section.id"
      class="material-section"
    >
      <header class="section-header">
        <button
          class="section-title-button"
          type="button"
          :aria-expanded="!isCollapsed(section.id)"
          @click="toggleSection(section.id)"
        >
          <ChevronRight v-if="isCollapsed(section.id)" :size="18" />
          <ChevronDown v-else :size="18" />
          <span class="section-title">{{ section.title }}</span>
        </button>
        <div class="section-actions">
          <span class="section-count">{{ section.materials.length }}</span>
          <button
            class="outline-button"
            type="button"
            title="查看本章总结与大纲"
            :aria-label="`查看${section.title}的总结与大纲`"
            @click="emit('openOutline', section.id)"
          >
            <ListTree :size="16" />
            <span class="outline-button-label">大纲</span>
          </button>
        </div>
      </header>

      <div v-if="!isCollapsed(section.id)" class="section-materials">
        <div
          v-for="material in section.materials"
          :key="material.id"
          class="material-row"
        >
          <button class="material-name" type="button" @click="emit('open', material)">
            {{ getMaterialTitle(material) }}
          </button>

          <LearningStatusBadge :status="props.getLearningStatus(material.id)" />

          <FavoriteButton
            :active="props.isFavorite(material.id)"
            @toggle="emit('toggleFavorite', material.id)"
          />

          <PlayButton
            v-if="material.audioUrl"
            :active="props.currentMaterialId === material.id"
            :playing="props.currentMaterialId === material.id && props.isPlaying"
            @toggle="emit('toggleAudio', material)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sectioned-list {
  display: grid;
  gap: 16px;
}

.empty-search {
  display: grid;
  justify-items: center;
  margin: 0;
  padding: 56px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  color: var(--color-muted);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.empty-title {
  margin: 16px 0 6px;
  color: var(--color-text-strong);
  font-size: 17px;
  font-weight: 620;
}

.empty-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
}

.material-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  overflow: hidden;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.section-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 60px;
  padding: 0 18px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(248, 248, 250, 0.78);
}

.section-title-button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--color-text-strong);
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  line-height: 1.35;
  text-align: left;
}

.section-title-button:hover {
  color: var(--color-primary);
}

.section-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

.section-count {
  display: inline-flex;
  min-width: 30px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(94, 106, 210, 0.1);
  color: var(--color-primary-strong);
  font-size: 13px;
  font-weight: 650;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.outline-button {
  display: inline-flex;
  min-width: 68px;
  height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid rgba(24, 24, 27, 0.11);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-muted-strong);
  cursor: pointer;
  font-size: 13px;
  font-weight: 620;
}

.outline-button:hover {
  border-color: rgba(94, 106, 210, 0.34);
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
}

.section-materials {
  display: grid;
}

.material-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 40px 40px;
  gap: 12px;
  align-items: center;
  min-height: 64px;
  padding: 10px 14px 10px 46px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.58);
  transition: background-color 160ms var(--ease-standard);
}

.material-row:first-child {
  border-top: 0;
}

.material-name {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  font-weight: 580;
  line-height: 1.45;
  text-align: left;
  overflow-wrap: anywhere;
}

.material-row:hover {
  background: rgba(255, 255, 255, 0.92);
}

.material-name:hover {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .section-header {
    padding: 0 12px;
  }

  .section-actions {
    gap: 8px;
  }

  .outline-button {
    width: 36px;
    min-width: 36px;
    padding: 0;
  }

  .outline-button-label {
    display: none;
  }

  .material-row {
    grid-template-columns: minmax(0, 1fr) 38px 38px;
    row-gap: 8px;
    padding-left: 18px;
  }

  .material-row :deep(.status-badge) {
    grid-column: 1;
    justify-self: start;
  }
}
</style>
