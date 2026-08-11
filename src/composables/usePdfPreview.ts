import type { MaybeRefOrGetter } from 'vue'

import { onScopeDispose, readonly, shallowRef, toValue, watch } from 'vue'

export function usePdfPreview(
  source: MaybeRefOrGetter<string | undefined>,
  fallbackSource?: MaybeRefOrGetter<string | undefined>,
) {
  const previewUrl = shallowRef('')
  const isLoading = shallowRef(false)
  const errorMessage = shallowRef('')
  const reloadVersion = shallowRef(0)
  let activeObjectUrl = ''

  function releaseObjectUrl() {
    if (activeObjectUrl) {
      URL.revokeObjectURL(activeObjectUrl)
      activeObjectUrl = ''
    }

    previewUrl.value = ''
  }

  function retry() {
    reloadVersion.value += 1
  }

  watch(
    [() => toValue(source), () => toValue(fallbackSource), reloadVersion],
    async ([sourceUrl, fallbackUrl], _previousValue, onCleanup) => {
      releaseObjectUrl()
      errorMessage.value = ''

      if (!sourceUrl) {
        isLoading.value = false
        return
      }

      const controller = new AbortController()
      let isCurrentRequest = true

      onCleanup(() => {
        isCurrentRequest = false
        controller.abort()
      })

      isLoading.value = true

      try {
        let pdfBlob: Blob

        try {
          pdfBlob = await fetchPdfBlob(sourceUrl, controller.signal)
        }
        catch (error) {
          if (isAbortError(error) || !fallbackUrl || fallbackUrl === sourceUrl) {
            throw error
          }

          // 直连失败（跨域、网络异常、内容损坏）时改走代理兜底
          pdfBlob = await fetchPdfBlob(fallbackUrl, controller.signal)
        }

        const objectUrl = URL.createObjectURL(pdfBlob)

        if (!isCurrentRequest) {
          URL.revokeObjectURL(objectUrl)
          return
        }

        activeObjectUrl = objectUrl
        previewUrl.value = objectUrl
      }
      catch (error) {
        if (!isCurrentRequest || isAbortError(error)) {
          return
        }

        errorMessage.value = getPdfLoadError(error)
      }
      finally {
        if (isCurrentRequest) {
          isLoading.value = false
        }
      }
    },
    { immediate: true },
  )

  onScopeDispose(releaseObjectUrl)

  return {
    previewUrl: readonly(previewUrl),
    isLoading: readonly(isLoading),
    errorMessage: readonly(errorMessage),
    retry,
  }
}

async function fetchPdfBlob(sourceUrl: string, signal: AbortSignal) {
  const response = await fetch(sourceUrl, { signal })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const sourceBlob = await response.blob()

  if (!(await isPdfBlob(sourceBlob))) {
    throw new Error('INVALID_PDF')
  }

  return sourceBlob.type === 'application/pdf'
    ? sourceBlob
    : sourceBlob.slice(0, sourceBlob.size, 'application/pdf')
}

// PDF 规范要求 %PDF- 文件头出现在文件前 1024 字节内。
// 校验魔数可以拦下被截断的响应和被当成 PDF 返回的 HTML 错误页。
async function isPdfBlob(blob: Blob) {
  const headText = new TextDecoder('latin1').decode(await blob.slice(0, 1024).arrayBuffer())

  return headText.includes('%PDF-')
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getPdfLoadError(error: unknown) {
  if (error instanceof Error && error.message === 'HTTP 403') {
    return 'PDF 无法访问，请检查 OSS 公共读权限。'
  }

  if (error instanceof Error && error.message === 'HTTP 502') {
    return '资料文件服务暂不可用，请检查 OSS 状态或后端配置。'
  }

  if (error instanceof Error && error.message === 'INVALID_PDF') {
    return 'PDF 文件内容不完整或已损坏，请重新加载。'
  }

  return 'PDF 加载失败，请检查 OSS 文件地址和跨域配置。'
}
