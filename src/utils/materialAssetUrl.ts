/*
 * @Author: ZR21110093-魏兆宇 weizhaoyu@zhongruigroup.com
 * @Date: 2026-07-09 10:36:21
 * @LastEditors: ZR21110093-魏兆宇 weizhaoyu@zhongruigroup.com
 * @LastEditTime: 2026-07-27 15:38:29
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


// const useLocalMaterials = false 本地也访问远程文件
const useLocalMaterials = import.meta.env.DEV //本地访问本地文件

export function getMaterialAssetUrl(
  materialId: string,
  fileName: 'document.pdf' | 'audio.mp3',
  collection: MaterialCollection = 'session5',
) {
  const baseUrl = useLocalMaterials
    ? `${localMaterialsBaseUrl}/${collection}`
    : remoteMaterialsBaseUrls[collection]

  return `${baseUrl}/${encodeURIComponent(materialId)}/${fileName}`
}

/**
 * 直连 OSS 失败时的兜底地址：走 Vercel 代理拉取。
 * 代理受函数响应体上限（约 4.5MB）和跨境网络影响，仅作备用通道。
 * 本地开发没有该 Serverless 函数，返回 undefined。
 */
export function getMaterialPdfFallbackUrl(
  materialId: string,
  collection: MaterialCollection = 'session5',
) {
  if (!import.meta.env.PROD) {
    return undefined
  }

  return `/api/material-pdf/${encodeURIComponent(materialId)}?collection=${collection}`
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}
