import type { MaterialCollection } from '@/types/material'

const defaultMaterialsBaseUrl = 'https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials'
const localMaterialsBaseUrl = '/materials'

const configuredMaterialsBaseUrl = import.meta.env.VITE_MATERIALS_BASE_URL?.trim()

export const materialsBaseUrl = normalizeBaseUrl(
  import.meta.env.DEV
    ? localMaterialsBaseUrl
    : configuredMaterialsBaseUrl || defaultMaterialsBaseUrl,
)

export function getMaterialAssetUrl(
  materialId: string,
  fileName: 'document.pdf' | 'audio.mp3',
  collection: MaterialCollection = 'session5',
) {
  if (import.meta.env.PROD && fileName === 'document.pdf') {
    return `/api/material-pdf/${encodeURIComponent(materialId)}?collection=${collection}`
  }

  return `${materialsBaseUrl}/${collection}/${encodeURIComponent(materialId)}/${fileName}`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
