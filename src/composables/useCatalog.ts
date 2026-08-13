import { computed, readonly, shallowRef } from 'vue'

import { isBackendEnabled } from '@/config/features'
import { folders as staticFolders } from '@/data/folders'
import { materials as staticMaterials } from '@/data/materials'
import {
  getAllMaterials,
  getFolders,
  type MaterialApiResponse,
} from '@/services/folderManagerApi'
import type { MaterialFolder, MaterialItem } from '@/types/material'
import { getMaterialAssetUrl } from '@/utils/materialAssetUrl'

const folders = shallowRef<MaterialFolder[]>([])
const materials = shallowRef<MaterialItem[]>([])
const isLoading = shallowRef(false)
const isLoaded = shallowRef(false)
const errorMessage = shallowRef('')
let activeLoad: Promise<void> | null = null

const materialById = computed(() => {
  return new Map(materials.value.map((material) => [material.id, material]))
})

export function useCatalog() {
  async function loadCatalog(force = false) {
    if (activeLoad) {
      return activeLoad
    }

    if (isLoaded.value && !force) {
      return
    }

    activeLoad = loadCatalogData()

    try {
      await activeLoad
    }
    finally {
      activeLoad = null
    }
  }

  return {
    folders: readonly(folders),
    materials: readonly(materials),
    materialById,
    isLoading: readonly(isLoading),
    isLoaded: readonly(isLoaded),
    errorMessage: readonly(errorMessage),
    loadCatalog,
  }
}

async function loadCatalogData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (!isBackendEnabled) {
      folders.value = staticFolders
      materials.value = staticMaterials
      isLoaded.value = true
      return
    }

    const [folderResponses, materialResponses] = await Promise.all([
      getFolders(),
      getAllMaterials(),
    ])

    folders.value = (folderResponses ?? []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      materialCount: folder.materialCount,
    }))
    materials.value = (materialResponses ?? []).map(toMaterialItem)
    isLoaded.value = true
  }
  catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : '目录加载失败，请稍后重试'
  }
  finally {
    isLoading.value = false
  }
}

function toMaterialItem(material: MaterialApiResponse): MaterialItem {
  return {
    id: material.id,
    folderId: material.folderId,
    name: material.name,
    collection: material.collection,
    pdfUrl: getMaterialAssetUrl(material.id, 'document.pdf', material.collection),
    audioUrl: material.audioUrl
      ? getMaterialAssetUrl(material.id, 'audio.mp3', material.collection)
      : undefined,

    // 恢复 OSS 时改回后端返回的地址：
    // pdfUrl: resolveBackendUrl(material.pdfUrl),
    // audioUrl: material.audioUrl ?? undefined,
  }
}
