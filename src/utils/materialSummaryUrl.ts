import type { MaterialCollection } from '@/types/material'

const configuredSummaryBaseUrl = import.meta.env.VITE_SUMMARIES_BASE_URL?.trim()
const summaryBaseUrl = normalizeBaseUrl(configuredSummaryBaseUrl || '/summaries')

export function getMaterialSummaryUrl(
  collection: MaterialCollection,
  materialId: string,
) {
  return `${summaryBaseUrl}/${collection}/${encodeURIComponent(materialId)}.json`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
