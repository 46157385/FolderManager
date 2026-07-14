import { season5Materials } from './materials'
import { thinkingMaterials } from './thinkingMaterials'
import type { MaterialFolder } from '@/types/material'

export const defaultFolderId = 'wwg-season-5'
export const thinkingFolderId = 'modern-thinking-100'

export const folders: MaterialFolder[] = [
  {
    id: defaultFolderId,
    name: '万维钢精英日课第五季',
    materialIds: season5Materials.map((material) => material.id),
  },
  {
    id: thinkingFolderId,
    name: '现代思维100讲',
    materialIds: thinkingMaterials.map((material) => material.id),
  },
]
