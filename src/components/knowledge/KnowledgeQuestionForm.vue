<script setup lang="ts">
import { Send } from '@lucide/vue'
import { computed } from 'vue'

interface Props {
  disabled?: boolean
  submitting?: boolean
}

interface Emits {
  submit: []
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  submitting: false,
})
const emit = defineEmits<Emits>()
const question = defineModel<string>({ required: true })
const canSubmit = computed(() => {
  return !props.disabled && !props.submitting && Boolean(question.value.trim())
})

function submit() {
  if (canSubmit.value) {
    emit('submit')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <form class="question-form" @submit.prevent="submit">
    <label class="question-field">
      <span class="sr-only">输入关于权力七规则的问题</span>
      <textarea
        v-model="question"
        class="question-input"
        :disabled="disabled || submitting"
        rows="3"
        maxlength="1000"
        placeholder="例如：为什么“顺民心态”会阻碍一个人获得权力？"
        @keydown="handleKeydown"
      />
    </label>

    <div class="question-footer">
      <span class="question-hint">Enter 发送 · Shift + Enter 换行</span>
      <button class="submit-button" type="submit" :disabled="!canSubmit">
        <Send :size="16" />
        <span>{{ submitting ? '正在查找依据…' : '提问' }}</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.question-form {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}

.question-form:focus-within {
  border-color: rgba(94, 106, 210, 0.38);
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.12), var(--shadow-soft);
}

.question-field {
  display: block;
}

.question-input {
  display: block;
  width: 100%;
  min-height: 76px;
  resize: vertical;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-strong);
  font: inherit;
  font-size: 14px;
  line-height: 1.65;
}

.question-input::placeholder {
  color: var(--color-muted);
}

.question-input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.question-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.question-hint {
  color: var(--color-muted);
  font-size: 11px;
}

.submit-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 15px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 680;
}

.submit-button:hover:not(:disabled) {
  background: var(--color-primary-strong);
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .question-footer {
    align-items: flex-end;
  }

  .question-hint {
    max-width: 150px;
  }
}
</style>
