<script setup lang="ts">
import { Eraser, LockKeyhole } from '@lucide/vue'
import { computed, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'

import KnowledgeMessageList from '@/components/knowledge/KnowledgeMessageList.vue'
import KnowledgeQuestionForm from '@/components/knowledge/KnowledgeQuestionForm.vue'
import { useCloudAuth } from '@/composables/useCloudAuth'
import { useKnowledgeChat } from '@/composables/useKnowledgeChat'

interface Props {
  knowledgeBaseId: string
}

const props = defineProps<Props>()
const question = shallowRef('')
const { isReady, isSignedIn } = useCloudAuth()
const {
  messages,
  isSubmitting,
  errorMessage,
  ask,
  clear,
} = useKnowledgeChat(props.knowledgeBaseId)
const canAsk = computed(() => isReady.value && isSignedIn.value)
const suggestions = [
  '“顺民心态”具体指什么？',
  '七条规则之间是什么关系？',
  '为什么建立个人品牌能增加权力？',
]

async function submitQuestion() {
  const submittedQuestion = question.value
  question.value = ''
  const didAnswer = await ask(submittedQuestion)
  if (!didAnswer) {
    question.value = submittedQuestion
  }
}

function useSuggestion(suggestion: string) {
  question.value = suggestion
}
</script>

<template>
  <section class="chat-panel">
    <header class="chat-header">
      <div>
        <p class="chat-eyebrow">RAG 知识库</p>
        <h1 class="chat-title">权力七规则 · AI 问答</h1>
        <p class="chat-description">
          根据 8 讲原文和结构化大纲回答，关键结论会标注可点击的文章来源。
        </p>
      </div>

      <button
        v-if="messages.length"
        class="clear-button"
        type="button"
        title="清空当前对话"
        @click="clear"
      >
        <Eraser :size="16" />
        <span>清空</span>
      </button>
    </header>

    <KnowledgeMessageList :messages="messages" :submitting="isSubmitting" />

    <section v-if="messages.length === 0" class="suggestion-list" aria-label="示例问题">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion"
        class="suggestion-button"
        type="button"
        :disabled="!canAsk"
        @click="useSuggestion(suggestion)"
      >
        {{ suggestion }}
      </button>
    </section>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <section v-if="isReady && !isSignedIn" class="auth-notice">
      <LockKeyhole :size="18" />
      <p>
        AI 问答需要登录，以保护本地模型计算资源。
        <RouterLink :to="{ name: 'login' }">前往登录</RouterLink>
      </p>
    </section>

    <KnowledgeQuestionForm
      v-model="question"
      :disabled="!canAsk"
      :submitting="isSubmitting"
      @submit="submitQuestion"
    />
  </section>
</template>

<style scoped>
.chat-panel {
  width: min(860px, calc(100% - 48px));
  margin: 0 auto;
  padding: 46px 0 72px;
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 22px;
  background:
    radial-gradient(circle at 92% 0%, rgba(94, 106, 210, 0.18), transparent 16rem),
    var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
}

.chat-eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 740;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.chat-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 30px;
  font-weight: 730;
  letter-spacing: -0.025em;
}

.chat-description {
  max-width: 620px;
  margin: 12px 0 0;
  color: var(--color-muted-strong);
  font-size: 13px;
  line-height: 1.7;
}

.clear-button {
  display: inline-flex;
  min-height: 38px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.75);
  color: var(--color-muted-strong);
  cursor: pointer;
  font-size: 12px;
}

.clear-button:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-strong);
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -56px 0 24px;
  padding: 0 18px;
  position: relative;
}

.suggestion-button {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid rgba(94, 106, 210, 0.16);
  border-radius: 999px;
  background: rgba(240, 240, 255, 0.7);
  color: var(--color-primary-strong);
  cursor: pointer;
  font-size: 11px;
}

.suggestion-button:hover:not(:disabled) {
  border-color: rgba(94, 106, 210, 0.3);
  background: var(--color-primary-soft);
}

.suggestion-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.error-message {
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid rgba(195, 61, 53, 0.18);
  border-radius: var(--radius-md);
  background: rgba(255, 239, 238, 0.88);
  color: var(--color-danger);
  font-size: 12px;
  line-height: 1.5;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 11px 13px;
  border: 1px solid rgba(155, 107, 18, 0.16);
  border-radius: var(--radius-md);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.auth-notice p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.auth-notice a {
  color: var(--color-primary-strong);
  font-weight: 680;
}

@media (max-width: 640px) {
  .chat-panel {
    width: min(100% - 24px, 860px);
    padding: 24px 0 48px;
  }

  .chat-header {
    display: grid;
    padding: 24px;
  }

  .chat-title {
    font-size: 25px;
  }

  .clear-button {
    justify-self: start;
  }

  .suggestion-list {
    margin-top: -38px;
    padding: 0 8px;
  }
}
</style>
