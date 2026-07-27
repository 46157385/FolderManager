import type { MaybeRefOrGetter } from 'vue'

import { onScopeDispose, readonly, shallowRef, toValue, watch } from 'vue'

export function usePdfPreview(source: MaybeRefOrGetter<string | undefined>) {
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
    [() => toValue(source), reloadVersion],
    async ([sourceUrl], _previousValue, onCleanup) => {
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
        const response = await fetch(sourceUrl, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const sourceBlob = await response.blob()
        const pdfBlob = sourceBlob.type === 'application/pdf'
          ? sourceBlob
          : sourceBlob.slice(0, sourceBlob.size, 'application/pdf')
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

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getPdfLoadError(error: unknown) {
  if (error instanceof Error && error.message === 'HTTP 403') {
    return 'PDF 无法访问，请检查 OSS 公共读权限。'
  }

  return 'PDF 加载失败，请检查 OSS 文件地址和跨域配置。'
}
