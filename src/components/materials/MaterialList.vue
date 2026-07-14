<script setup lang="ts">
import { computed } from 'vue'

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
  gap: 12px;
}

.material-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px 40px;
  gap: 12px;
  align-items: center;
  min-height: 64px;
  padding: 10px 12px 10px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  transition:
    background-color 160ms var(--ease-standard),
    border-color 160ms var(--ease-standard),
    box-shadow 160ms var(--ease-standard),
    transform 160ms var(--ease-standard);
}

.material-row:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.material-name {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  font-weight: 560;
  line-height: 1.45;
  text-align: left;
  overflow-wrap: anywhere;
}

.material-name:hover {
  color: var(--color-primary);
}
</style>
