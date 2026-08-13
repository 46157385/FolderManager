import { readonly, shallowRef } from 'vue'

import {
  askKnowledgeBaseStream,
  FolderManagerApiError,
} from '@/services/folderManagerApi'
import type { KnowledgeChatMessage } from '@/types/knowledge'

const TYPEWRITER_TICK_MS = 40
const TYPEWRITER_CATCH_UP_RATIO = 60

export function useKnowledgeChat(knowledgeBaseId: string) {
  const messages = shallowRef<readonly KnowledgeChatMessage[]>([])
  const isSubmitting = shallowRef(false)
  const errorMessage = shallowRef('')
  let activeTypewriter: Typewriter | null = null

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
    const typewriter = createTypewriter((revealedText) => {
      updateMessage(assistantMessage.id, { content: revealedText })
    })
    activeTypewriter = typewriter

    try {
      const response = await askKnowledgeBaseStream(
        knowledgeBaseId,
        normalizedQuestion,
        delta => typewriter.push(delta),
      )
      await typewriter.finish()
      updateMessage(assistantMessage.id, {
        content: response.answer,
        sources: response.sources,
        streaming: false,
      })
      return true
    }
    catch (error) {
      typewriter.cancel()
      if (typewriter.receivedText) {
        updateMessage(assistantMessage.id, {
          content: typewriter.receivedText,
          streaming: false,
        })
      }
      else {
        messages.value = messages.value.filter(message => message.id !== assistantMessage.id)
      }
      errorMessage.value = getQuestionErrorMessage(error)
      return false
    }
    finally {
      activeTypewriter = null
      isSubmitting.value = false
    }
  }

  function clear() {
    activeTypewriter?.cancel()
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

interface Typewriter {
  push: (delta: string) => void
  finish: () => Promise<void>
  cancel: () => void
  readonly receivedText: string
}

// 网络按突发批次送达文本,这里缓冲后按字匀速放出;积压越多每拍放出越多,保证能追上流尾。
function createTypewriter(onReveal: (text: string) => void): Typewriter {
  let received = ''
  let revealedLength = 0
  let timer: ReturnType<typeof setInterval> | null = null
  let finished = false
  let resolveFinish: (() => void) | null = null

  function step() {
    if (revealedLength < received.length) {
      const backlog = received.length - revealedLength
      const charsPerTick = Math.max(1, Math.ceil(backlog / TYPEWRITER_CATCH_UP_RATIO))
      revealedLength = Math.min(received.length, revealedLength + charsPerTick)
      onReveal(received.slice(0, revealedLength))
    }
    if (finished && revealedLength >= received.length) {
      stopTimer()
      resolveFinish?.()
    }
  }

  function startTimer() {
    if (timer === null) {
      timer = setInterval(step, TYPEWRITER_TICK_MS)
    }
  }

  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    push(delta: string) {
      received += delta
      startTimer()
    },
    finish() {
      finished = true
      if (revealedLength >= received.length) {
        stopTimer()
        return Promise.resolve()
      }
      startTimer()
      return new Promise<void>((resolve) => {
        resolveFinish = resolve
      })
    },
    cancel() {
      finished = true
      stopTimer()
    },
    get receivedText() {
      return received
    },
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
