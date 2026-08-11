import type { MaterialCollection } from '@/types/material'

export interface OutlineNode {
  id: string
  label: string
  detail?: string
  children: readonly OutlineNode[]
}

export interface SectionOutlineSource {
  materialId: string
  title: string
}

export interface SectionOutline {
  schemaVersion: 1
  collection: MaterialCollection
  sectionId: string
  title: string
  summary: string
  keyPoints: readonly string[]
  root: OutlineNode
  sources: readonly SectionOutlineSource[]
  sourceHash: string
  generatedAt: string
}
