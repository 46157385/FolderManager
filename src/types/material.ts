export type MaterialCollection = 'session5' | 'thinking'

export interface MaterialItem {
  id: string
  folderId?: string
  name: string
  pdfUrl: string
  audioUrl?: string
  collection?: MaterialCollection
}

export interface MaterialFolder {
  id: string
  name: string
  materialIds?: string[]
  materialCount?: number
}

export interface MaterialSection {
  id: string
  title: string
  materialIds: string[]
}

export interface MaterialStats {
  materialId: string
  viewCount: number
  lastViewedAt?: string
}

export interface ViewHistory {
  id: string
  materialId: string
  materialName: string
  viewedAt: string
}
