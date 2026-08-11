import type { MaterialCollection } from '@/types/material'

const configuredOutlineBaseUrl = import.meta.env.VITE_OUTLINES_BASE_URL?.trim()
const outlineBaseUrl = normalizeBaseUrl(configuredOutlineBaseUrl || '/outlines')

export function getSectionOutlineUrl(
  collection: MaterialCollection,
  sectionId: string,
) {
  return `${outlineBaseUrl}/${collection}/${encodeURIComponent(sectionId)}.json`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
