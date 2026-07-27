/*
 * @Author: ZR21110093-魏兆宇 weizhaoyu@zhongruigroup.com
 * @Date: 2026-07-09 10:36:21
 * @LastEditors: ZR21110093-魏兆宇 weizhaoyu@zhongruigroup.com
 * @LastEditTime: 2026-07-27 14:23:46
 * @FilePath: /FolderManager/src/utils/materialAssetUrl.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { MaterialCollection } from '@/types/material'

const localMaterialsBaseUrl = '/materials'

const defaultRemoteMaterialsBaseUrls: Record<MaterialCollection, string> = {
  session5: 'https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials',
  thinking: 'https://wwg-thinking.oss-cn-beijing.aliyuncs.com/materials',
}

const configuredRemoteMaterialsBaseUrls: Partial<Record<MaterialCollection, string>> = {
  session5: import.meta.env.VITE_MATERIALS_BASE_URL?.trim(),
  thinking: import.meta.env.VITE_THINKING_MATERIALS_BASE_URL?.trim(),
}

const remoteMaterialsBaseUrls = Object.fromEntries(
  Object.entries(defaultRemoteMaterialsBaseUrls).map(([collection, defaultBaseUrl]) => [
    collection,
    normalizeBaseUrl(
      configuredRemoteMaterialsBaseUrls[collection as MaterialCollection] || defaultBaseUrl,
    ),
  ]),
) as Record<MaterialCollection, string>

// OSS 联调期间临时强制开发环境读取远程文件；测试完成后恢复下一行并删除 false。
// const useLocalMaterials = import.meta.env.DEV
const useLocalMaterials = false

export function getMaterialAssetUrl(
  materialId: string,
  fileName: 'document.pdf' | 'audio.mp3',
  collection: MaterialCollection = 'session5',
) {
  if (!useLocalMaterials && import.meta.env.PROD && fileName === 'document.pdf') {
    return `/api/material-pdf/${encodeURIComponent(materialId)}?collection=${collection}`
  }

  const baseUrl = useLocalMaterials
    ? `${localMaterialsBaseUrl}/${collection}`
    : remoteMaterialsBaseUrls[collection]

  return `${baseUrl}/${encodeURIComponent(materialId)}/${fileName}`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
