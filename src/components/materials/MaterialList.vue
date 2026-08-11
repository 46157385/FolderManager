<script setup lang="ts">
import { computed } from 'vue'

import LearningStatusBadge from '@/components/learning/LearningStatusBadge.vue'
import type { LearningStatus } from '@/types/learning'
import type { MaterialItem } from '@/types/material'
import { getMaterialTitle } from '@/utils/materialTitle'
import FavoriteButton from './FavoriteButton.vue'
import PlayButton from './PlayButton.vue'

interface Props {
  materials: MaterialItem[]
  currentMaterialId: string | null
  isPlaying: boolean
  sortDirection: 'asc' | 'desc'
  isFavorite: (materialId: string) => boolean
  getLearningStatus: (materialId: string) => LearningStatus
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [material: MaterialItem]
  toggleAudio: [material: MaterialItem]
  toggleFavorite: [materialId: string]
}>()

const sortedMaterials = computed(() => {
  return [...props.materials].sort((a, b) => {
    const result = getMaterialTitle(a).localeCompare(getMaterialTitle(b), 'zh-Hans-CN')
    return props.sortDirection === 'asc' ? result : -result
  })
})
</script>

<template>
  <div class="material-list">
    <div
      v-for="material in sortedMaterials"
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
</template>

<style scoped>
.material-list {
  display: grid;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
  overflow: hidden;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.material-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 40px 40px;
  gap: 12px;
  align-items: center;
  min-height: 66px;
  padding: 11px 14px 11px 20px;
  border: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  transition:
    background-color 160ms var(--ease-standard),
    border-color 160ms var(--ease-standard),
    box-shadow 160ms var(--ease-standard),
    transform 160ms var(--ease-standard);
}

.material-row:first-child {
  border-top: 0;
}

.material-row:hover {
  background: rgba(255, 255, 255, 0.88);
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

.material-name:hover {
  color: var(--color-primary);
}

@media (max-width: 520px) {
  .material-row {
    grid-template-columns: minmax(0, 1fr) 38px 38px;
    row-gap: 8px;
  }

  .material-row :deep(.status-badge) {
    grid-column: 1;
    justify-self: start;
  }
}
</style>
