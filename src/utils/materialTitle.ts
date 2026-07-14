import { season5MaterialTitles } from '@/data/season5Sections'
import type { MaterialItem } from '@/types/material'

export function stripMaterialPrefix(name: string) {
  return name.replace(/^[a-z]+-\d{4}丨/, '').replace(/^\d{2}丨/, '').trim()
}

export function getMaterialTitle(material: MaterialItem) {
  return season5MaterialTitles[material.id] ?? stripMaterialPrefix(material.name)
}
