const localMaterialsBaseUrl = '/materials'

const configuredMaterialsBaseUrl = import.meta.env.VITE_MATERIALS_BASE_URL?.trim()

export const materialsBaseUrl = normalizeBaseUrl(configuredMaterialsBaseUrl ?? localMaterialsBaseUrl)

export function getMaterialAssetUrl(materialId: string, fileName: 'document.pdf' | 'audio.mp3') {
  return `${materialsBaseUrl}/${encodeURIComponent(materialId)}/${fileName}`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
