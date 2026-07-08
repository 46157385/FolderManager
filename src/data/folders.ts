import { materials } from './materials'
import type { MaterialFolder } from '@/types/material'

export const defaultFolderId = 'wwg-season-5'

export const folders: MaterialFolder[] = [
  {
    id: defaultFolderId,
    name: '万维钢精英日课第五季',
    materialIds: materials.map((material) => material.id),
  },
]
