const defaultMaterialsBaseUrl = 'https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials'

const configuredMaterialsBaseUrl = import.meta.env.VITE_MATERIALS_BASE_URL?.trim()

export const materialsBaseUrl = normalizeBaseUrl(configuredMaterialsBaseUrl || defaultMaterialsBaseUrl)

export function getMaterialAssetUrl(materialId: string, fileName: 'document.pdf' | 'audio.mp3') {
  if (fileName === 'document.pdf') {
    return `/api/material-pdf/${encodeURIComponent(materialId)}`
  }

  return `${materialsBaseUrl}/${encodeURIComponent(materialId)}/${fileName}`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
