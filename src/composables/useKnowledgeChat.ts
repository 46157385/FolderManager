import { readonly, shallowRef } from 'vue'

import {
  askKnowledgeBaseStream,
  FolderManagerApiError,
} from '@/services/folderManagerApi'
import type { KnowledgeChatMessage } from '@/types/knowledge'

export function useKnowledgeChat(knowledgeBaseId: string) {
  const messages = shallowRef<readonly KnowledgeChatMessage[]>([])
  const isSubmitting = shallowRef(false)
  const errorMessage = shallowRef('')

  async function ask(question: string) {
    const normalizedQuestion = question.trim()
    if (!normalizedQuestion || isSubmitting.value) {
      return false
    }

    const assistantMessage = {
      ...createMessage('assistant', ''),
      streaming: true,
    }
    messages.value = [
      ...messages.value,
      createMessage('user', normalizedQuestion),
      assistantMessage,
    ]
    isSubmitting.value = true
    errorMessage.value = ''
    let streamedAnswer = ''

    try {
      const response = await askKnowledgeBaseStream(
        knowledgeBaseId,
        normalizedQuestion,
        (delta) => {
          streamedAnswer += delta
          updateMessage(assistantMessage.id, {
            content: streamedAnswer,
          })
        },
      )
      updateMessage(assistantMessage.id, {
        content: response.answer,
        sources: response.sources,
        streaming: false,
      })
      return true
    }
    catch (error) {
      if (streamedAnswer) {
        updateMessage(assistantMessage.id, { streaming: false })
      }
      else {
        messages.value = messages.value.filter(message => message.id !== assistantMessage.id)
      }
      errorMessage.value = getQuestionErrorMessage(error)
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  function clear() {
    messages.value = []
    errorMessage.value = ''
  }

  function updateMessage(
    messageId: string,
    update: Partial<KnowledgeChatMessage>,
  ) {
    messages.value = messages.value.map(message =>
      message.id === messageId
        ? { ...message, ...update }
        : message,
    )
  }

  return {
    messages: readonly(messages),
    isSubmitting: readonly(isSubmitting),
    errorMessage: readonly(errorMessage),
    ask,
    clear,
  }
}

function createMessage(
  role: KnowledgeChatMessage['role'],
  content: string,
): KnowledgeChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  }
}

function getQuestionErrorMessage(error: unknown) {
  if (error instanceof FolderManagerApiError) {
    if (error.status === 401) {
      return '请先登录，再使用 AI 知识库问答。'
    }
    if (error.errorCode === 'knowledge_base_not_indexed') {
      return '知识库还没有建立索引，请先完成后端索引重建。'
    }
    return error.message
  }
  return '问答请求失败，请稍后重试。'
}
