<script setup lang="ts">
import { Bot, BookOpenText, LoaderCircle, UserRound } from '@lucide/vue'
import { nextTick, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'

import type { KnowledgeChatMessage } from '@/types/knowledge'

interface Props {
  messages: readonly KnowledgeChatMessage[]
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})
const listRef = useTemplateRef<HTMLElement>('list')

watch(
  () => [
    props.messages.length,
    props.messages[props.messages.length - 1]?.content.length ?? 0,
    props.submitting,
  ] as const,
  async () => {
    await nextTick()
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <section ref="list" class="message-list" aria-live="polite">
    <div v-if="messages.length === 0" class="empty-state">
      <span class="empty-icon"><BookOpenText :size="23" /></span>
      <h2 class="empty-title">从原文和大纲中找答案</h2>
      <p class="empty-description">
        可以询问概念、规则之间的联系、文中案例，或让 AI 对比不同讲次的主张。
      </p>
    </div>

    <article
      v-for="message in messages"
      :key="message.id"
      class="message"
      :class="`message-${message.role}`"
    >
      <span class="message-avatar" aria-hidden="true">
        <UserRound v-if="message.role === 'user'" :size="17" />
        <Bot v-else :size="18" />
      </span>

      <div class="message-body">
        <p class="message-label">{{ message.role === 'user' ? '你' : 'AI 知识助手' }}</p>
        <p v-if="message.content" class="message-content">{{ message.content }}</p>

        <p v-if="message.streaming" class="streaming-status">
          <LoaderCircle class="loading-icon" :size="15" />
          <span>{{ message.content ? '正在生成回答…' : '正在检索原文和大纲…' }}</span>
        </p>

        <ol v-if="message.sources?.length" class="source-list">
          <li
            v-for="source in message.sources"
            :key="`${message.id}-${source.reference}`"
            class="source-item"
          >
            <RouterLink
              class="source-link"
              :to="{ name: 'reader', params: { id: source.materialId } }"
            >
              <span class="source-reference">[资料{{ source.reference }}]</span>
              <span class="source-copy">
                <strong>{{ source.title }}</strong>
                <small>{{ source.section }} · {{ source.sourceType === 'article' ? '原文' : '大纲' }}</small>
              </span>
            </RouterLink>
            <p class="source-excerpt">{{ source.excerpt }}</p>
          </li>
        </ol>
      </div>
    </article>

  </section>
</template>

<style scoped>
.message-list {
  min-height: 360px;
  max-height: calc(100vh - 360px);
  overflow-y: auto;
  scroll-behavior: smooth;
}

.empty-state {
  display: grid;
  min-height: 330px;
  place-items: center;
  align-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(94, 106, 210, 0.2);
  border-radius: 15px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.empty-title {
  margin: 18px 0 0;
  color: var(--color-text-strong);
  font-size: 18px;
}

.empty-description {
  max-width: 530px;
  margin: 10px 0 0;
  color: var(--color-muted-strong);
  font-size: 13px;
  line-height: 1.7;
}

.message {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  padding: 22px 4px;
  border-bottom: 1px solid var(--color-border);
}

.message:last-child {
  border-bottom: 0;
}

.message-avatar {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: #fff;
  color: var(--color-muted-strong);
}

.message-assistant .message-avatar {
  border-color: rgba(94, 106, 210, 0.2);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.message-body {
  min-width: 0;
}

.message-label {
  margin: 1px 0 8px;
  color: var(--color-muted-strong);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: 0.04em;
}

.message-content {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.source-list {
  display: grid;
  gap: 9px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.source-item {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
}

.source-link {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--color-text-strong);
}

.source-link:hover strong {
  color: var(--color-primary-strong);
}

.source-reference {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 720;
}

.source-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.source-copy strong {
  font-size: 12px;
  line-height: 1.45;
}

.source-copy small {
  color: var(--color-muted);
  font-size: 11px;
}

.source-excerpt {
  margin: 9px 0 0 0;
  color: var(--color-muted-strong);
  font-size: 12px;
  line-height: 1.65;
}

.streaming-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: var(--color-muted-strong);
  font-size: 12px;
}

.loading-icon {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .message-list {
    max-height: none;
  }

  .message {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 9px;
  }

  .message-avatar {
    width: 30px;
    height: 30px;
  }
}
</style>
