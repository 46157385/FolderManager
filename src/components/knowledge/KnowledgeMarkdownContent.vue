<script setup lang="ts">
import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import { computed } from 'vue'

interface Props {
  content: string
}

const props = defineProps<Props>()
const markdownParser = new Marked({
  breaks: true,
  gfm: true,
})

const safeHtml = computed(() => {
  const renderedMarkdown = markdownParser.parse(props.content, { async: false })
  return DOMPurify.sanitize(renderedMarkdown, {
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['style'],
    USE_PROFILES: { html: true },
  })
})
</script>

<template>
  <div class="markdown-content" v-html="safeHtml" />
</template>

<style scoped>
.markdown-content {
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.markdown-content :deep(:first-child) {
  margin-top: 0;
}

.markdown-content :deep(:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: 1.35em 0 0.55em;
  color: var(--color-text-strong);
  font-weight: 720;
  line-height: 1.4;
  letter-spacing: -0.015em;
}

.markdown-content :deep(h1) {
  font-size: 20px;
}

.markdown-content :deep(h2) {
  padding-bottom: 7px;
  border-bottom: 1px solid var(--color-border);
  font-size: 18px;
}

.markdown-content :deep(h3) {
  font-size: 16px;
}

.markdown-content :deep(h4) {
  font-size: 14px;
}

.markdown-content :deep(p) {
  margin: 0.75em 0;
}

.markdown-content :deep(strong) {
  color: var(--color-text-strong);
  font-weight: 720;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  padding-left: 0.15rem;
}

.markdown-content :deep(li + li) {
  margin-top: 0.35em;
}

.markdown-content :deep(li > p) {
  margin: 0.35em 0;
}

.markdown-content :deep(blockquote) {
  margin: 1em 0;
  padding: 10px 14px;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-primary-soft);
  color: var(--color-muted-strong);
}

.markdown-content :deep(hr) {
  height: 1px;
  margin: 1.4em 0;
  border: 0;
  background: var(--color-border);
}

.markdown-content :deep(a) {
  color: var(--color-primary-strong);
  text-decoration: underline;
  text-decoration-color: rgba(79, 88, 189, 0.35);
  text-underline-offset: 3px;
}

.markdown-content :deep(code) {
  padding: 0.15em 0.38em;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-subtle);
  color: #a33b59;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.88em;
}

.markdown-content :deep(pre) {
  max-width: 100%;
  margin: 1em 0;
  padding: 14px;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #202126;
  color: #f3f3f5;
  line-height: 1.6;
}

.markdown-content :deep(pre code) {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.markdown-content :deep(table) {
  display: block;
  width: 100%;
  margin: 1em 0;
  overflow-x: auto;
  border-collapse: collapse;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  min-width: 110px;
  padding: 8px 10px;
  border: 1px solid var(--color-border-strong);
  text-align: left;
  vertical-align: top;
}

.markdown-content :deep(th) {
  background: var(--color-surface-subtle);
  color: var(--color-text-strong);
  font-weight: 680;
}
</style>
