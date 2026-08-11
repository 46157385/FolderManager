<script setup lang="ts">
import {
  BookOpen,
  FileText,
  ListTree,
  Loader2,
  Network,
  RefreshCw,
  TriangleAlert,
  X,
} from '@lucide/vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'

import { useMaterialSummary } from '@/composables/useMaterialSummary'
import { useSectionOutline } from '@/composables/useSectionOutline'
import type { MaterialCollection } from '@/types/material'
import MindMapView from './MindMapView.vue'
import OutlineTree from './OutlineTree.vue'

type OutlineTab = 'summary' | 'tree' | 'mind-map'
type OutlineResourceType = 'section' | 'material'

interface Props {
  open: boolean
  collection: MaterialCollection
  resourceType?: OutlineResourceType
  sectionId?: string
  materialId?: string
  sectionTitle: string
}

const props = withDefaults(defineProps<Props>(), {
  resourceType: 'section',
  sectionId: undefined,
  materialId: undefined,
})

const emit = defineEmits<{
  close: []
}>()

const activeTab = shallowRef<OutlineTab>('summary')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const drawerPanel = useTemplateRef<HTMLElement>('drawerPanel')
const sectionOutline = useSectionOutline()
const materialSummary = useMaterialSummary()
const isMaterialSummary = computed(() => props.resourceType === 'material')
const outline = computed(() => {
  return isMaterialSummary.value ? materialSummary.summary.value : sectionOutline.outline.value
})
const loadState = computed(() => {
  return isMaterialSummary.value ? materialSummary.loadState.value : sectionOutline.loadState.value
})
const errorMessage = computed(() => {
  return isMaterialSummary.value
    ? materialSummary.errorMessage.value
    : sectionOutline.errorMessage.value
})
const scopeLabel = computed(() => isMaterialSummary.value ? '本文' : '本章')
const eyebrowLabel = computed(() => isMaterialSummary.value ? '文章大纲' : '章节大纲')

let previousBodyOverflow: string | null = null

watch(
  () => [
    props.open,
    props.collection,
    props.resourceType,
    props.sectionId,
    props.materialId,
  ] as const,
  ([open]) => {
    if (!open) {
      resetOutlines()
      return
    }

    activeTab.value = 'summary'
    loadCurrentOutline()
  },
  { immediate: true },
)

watch(
  () => props.open,
  (open) => {
    if (!open) {
      unlockBodyScroll()
      return
    }

    lockBodyScroll()
    void nextTick(() => closeButton.value?.focus())
  },
  { flush: 'post', immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  resetOutlines()
  unlockBodyScroll()
})

function retry() {
  if (!props.open) {
    return
  }

  loadCurrentOutline()
}

function loadCurrentOutline() {
  if (isMaterialSummary.value && props.materialId) {
    void materialSummary.load({
      collection: props.collection,
      materialId: props.materialId,
    })
    return
  }

  if (!isMaterialSummary.value && props.sectionId) {
    void sectionOutline.load({
      collection: props.collection,
      sectionId: props.sectionId,
    })
  }
}

function resetOutlines() {
  sectionOutline.reset()
  materialSummary.reset()
}

function requestClose() {
  emit('close')
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    requestClose()
    return
  }

  if (event.key === 'Tab') {
    keepFocusInDrawer(event)
  }
}

function keepFocusInDrawer(event: KeyboardEvent) {
  const panel = drawerPanel.value
  if (!panel) {
    return
  }

  const focusableElements = Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  )

  if (focusableElements.length === 0) {
    event.preventDefault()
    panel.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (!panel.contains(activeElement)) {
    event.preventDefault()
    firstElement.focus()
    return
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || previousBodyOverflow !== null) {
    return
  }

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || previousBodyOverflow === null) {
    return
  }

  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = null
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="drawer-backdrop"
      @click.self="requestClose"
    >
      <aside
        ref="drawerPanel"
        class="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-outline-title"
        tabindex="-1"
      >
        <header class="drawer-header">
          <div class="drawer-heading">
            <p class="drawer-eyebrow">{{ eyebrowLabel }}</p>
            <h2 id="section-outline-title" class="drawer-title">
              {{ props.sectionTitle }}
            </h2>
          </div>

          <button
            ref="closeButton"
            class="close-button"
            type="button"
            title="关闭大纲"
            :aria-label="`关闭${scopeLabel}大纲`"
            @click="requestClose"
          >
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <div class="drawer-content">
          <section
            v-if="loadState === 'idle' || loadState === 'loading'"
            class="state-card"
            aria-live="polite"
            aria-busy="true"
          >
            <span class="state-icon state-icon--loading">
              <Loader2 :size="25" aria-hidden="true" />
            </span>
            <h3 class="state-title">正在加载{{ scopeLabel }}大纲</h3>
            <p class="state-description">正在读取已经生成的总结与知识结构。</p>
          </section>

          <section
            v-else-if="loadState === 'missing'"
            class="state-card"
            aria-live="polite"
          >
            <span class="state-icon">
              <FileText :size="25" aria-hidden="true" />
            </span>
            <h3 class="state-title">{{ scopeLabel }}大纲尚未生成</h3>
            <p class="state-description">资料完成后台处理后，即可在这里直接查看。</p>
          </section>

          <section
            v-else-if="loadState === 'error'"
            class="state-card"
            role="alert"
          >
            <span class="state-icon state-icon--error">
              <TriangleAlert :size="25" aria-hidden="true" />
            </span>
            <h3 class="state-title">大纲加载失败</h3>
            <p class="state-description">
              {{ errorMessage || '请稍后重试。' }}
            </p>
            <button class="retry-button" type="button" @click="retry">
              <RefreshCw :size="16" aria-hidden="true" />
              重新加载
            </button>
          </section>

          <div v-else-if="outline" class="outline-success">
            <nav class="outline-tabs" role="tablist" aria-label="大纲展示方式">
              <button
                id="outline-summary-tab"
                class="tab-button"
                :class="{ 'tab-button--active': activeTab === 'summary' }"
                type="button"
                role="tab"
                aria-controls="outline-summary-panel"
                :aria-selected="activeTab === 'summary'"
                @click="activeTab = 'summary'"
              >
                <FileText :size="17" aria-hidden="true" />
                总结
              </button>
              <button
                id="outline-tree-tab"
                class="tab-button"
                :class="{ 'tab-button--active': activeTab === 'tree' }"
                type="button"
                role="tab"
                aria-controls="outline-tree-panel"
                :aria-selected="activeTab === 'tree'"
                @click="activeTab = 'tree'"
              >
                <ListTree :size="17" aria-hidden="true" />
                框架树
              </button>
              <button
                id="outline-mind-map-tab"
                class="tab-button"
                :class="{ 'tab-button--active': activeTab === 'mind-map' }"
                type="button"
                role="tab"
                aria-controls="outline-mind-map-panel"
                :aria-selected="activeTab === 'mind-map'"
                @click="activeTab = 'mind-map'"
              >
                <Network :size="17" aria-hidden="true" />
                思维导图
              </button>
            </nav>

            <section
              v-if="activeTab === 'summary'"
              id="outline-summary-panel"
              class="tab-panel"
              role="tabpanel"
              aria-labelledby="outline-summary-tab"
              tabindex="0"
            >
              <h3 class="content-title">{{ scopeLabel }}总结</h3>
              <p class="summary-copy">{{ outline.summary }}</p>

              <div v-if="outline.keyPoints.length > 0" class="key-points">
                <h4 class="content-subtitle">关键要点</h4>
                <ul class="key-point-list">
                  <li
                    v-for="(point, index) in outline.keyPoints"
                    :key="`${index}-${point}`"
                    class="key-point"
                  >
                    {{ point }}
                  </li>
                </ul>
              </div>
            </section>

            <section
              v-else-if="activeTab === 'tree'"
              id="outline-tree-panel"
              class="tab-panel"
              role="tabpanel"
              aria-labelledby="outline-tree-tab"
              tabindex="0"
            >
              <OutlineTree :node="outline.root" />
            </section>

            <section
              v-else
              id="outline-mind-map-panel"
              class="tab-panel"
              role="tabpanel"
              aria-labelledby="outline-mind-map-tab"
              tabindex="0"
            >
              <MindMapView :root="outline.root" />
            </section>

            <section class="outline-sources" aria-labelledby="outline-sources-title">
              <header class="sources-header">
                <BookOpen :size="18" aria-hidden="true" />
                <h3 id="outline-sources-title" class="sources-title">内容来源</h3>
                <span class="source-count">{{ outline.sources.length }}</span>
              </header>

              <ol v-if="outline.sources.length > 0" class="source-list">
                <li
                  v-for="source in outline.sources"
                  :key="source.materialId"
                  class="source-item"
                >
                  {{ source.title }}
                </li>
              </ol>
              <p v-else class="empty-sources">暂未记录来源资料。</p>
            </section>
          </div>

          <section v-else class="state-card" role="alert">
            <span class="state-icon state-icon--error">
              <TriangleAlert :size="25" aria-hidden="true" />
            </span>
            <h3 class="state-title">大纲数据不可用</h3>
            <p class="state-description">请重新加载{{ scopeLabel }}大纲。</p>
            <button class="retry-button" type="button" @click="retry">
              <RefreshCw :size="16" aria-hidden="true" />
              重新加载
            </button>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(23, 23, 27, 0.38);
  backdrop-filter: blur(4px);
  overscroll-behavior: contain;
}

.drawer-panel {
  display: grid;
  width: min(720px, calc(100vw - 48px));
  height: 100dvh;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  outline: none;
  background: rgba(250, 250, 251, 0.96);
  color: var(--color-text);
  box-shadow: -24px 0 72px rgba(24, 24, 27, 0.2);
  backdrop-filter: blur(22px);
}

.drawer-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: start;
  padding: 22px 24px 20px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(250, 250, 251, 0.82);
}

.drawer-heading {
  min-width: 0;
}

.drawer-eyebrow {
  margin: 0 0 7px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 680;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.drawer-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 22px;
  font-weight: 680;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.close-button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-muted-strong);
  cursor: pointer;
}

.close-button:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-subtle);
  color: var(--color-text-strong);
}

.drawer-content {
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  overscroll-behavior: contain;
  scrollbar-color: var(--color-border-strong) transparent;
}

.state-card {
  display: grid;
  min-height: min(430px, 68vh);
  align-content: center;
  justify-items: center;
  padding: 48px 20px;
  color: var(--color-muted);
  text-align: center;
}

.state-icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-subtle);
  color: var(--color-primary);
}

.state-icon--loading svg {
  animation: outline-spin 900ms linear infinite;
}

.state-icon--error {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.state-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 660;
  line-height: 1.4;
}

.state-description {
  max-width: 390px;
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
}

.retry-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 0 15px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-surface);
  cursor: pointer;
  font-size: 14px;
  font-weight: 640;
}

.retry-button:hover {
  border-color: var(--color-primary-strong);
  background: var(--color-primary-strong);
}

.outline-success {
  min-width: 0;
}

.outline-tabs {
  position: sticky;
  z-index: 1;
  top: -24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin: -24px -24px 24px;
  padding: 12px 24px 0;
  border-bottom: 1px solid var(--color-border);
  background: rgba(250, 250, 251, 0.9);
}

.tab-button {
  display: inline-flex;
  min-width: 0;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 14px;
  font-weight: 620;
  white-space: nowrap;
}

.tab-button:hover {
  color: var(--color-text-strong);
}

.tab-button--active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary-strong);
}

.tab-panel {
  min-width: 0;
  outline: none;
}

.tab-panel:focus-visible {
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.13);
}

.content-title {
  margin: 0 0 12px;
  color: var(--color-text-strong);
  font-size: 19px;
  font-weight: 660;
}

.summary-copy {
  margin: 0;
  color: var(--color-text);
  font-size: 15px;
  line-height: 1.85;
  white-space: pre-line;
}

.key-points {
  margin-top: 28px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.content-subtitle {
  margin: 0 0 13px;
  color: var(--color-text-strong);
  font-size: 15px;
  font-weight: 660;
}

.key-point-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 21px;
}

.key-point {
  padding-left: 3px;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.7;
}

.key-point::marker {
  color: var(--color-primary);
}

.outline-sources {
  margin-top: 32px;
  padding-top: 22px;
  border-top: 1px solid var(--color-border);
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted-strong);
}

.sources-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 15px;
  font-weight: 650;
}

.source-count {
  display: inline-flex;
  min-width: 24px;
  height: 22px;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-size: 12px;
  font-weight: 680;
}

.source-list {
  display: grid;
  gap: 7px;
  margin: 13px 0 0;
  padding-left: 21px;
}

.source-item {
  padding-left: 3px;
  color: var(--color-muted-strong);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.empty-sources {
  margin: 12px 0 0;
  color: var(--color-muted);
  font-size: 13px;
}

@keyframes outline-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .drawer-backdrop {
    background: var(--color-surface);
    backdrop-filter: none;
  }

  .drawer-panel {
    width: 100%;
    max-width: none;
    box-shadow: none;
  }

  .drawer-header {
    gap: 14px;
    padding: 16px;
  }

  .drawer-title {
    font-size: 19px;
  }

  .drawer-content {
    padding: 18px 16px 28px;
  }

  .outline-tabs {
    top: -18px;
    margin: -18px -16px 22px;
    padding: 8px 16px 0;
  }

  .tab-button {
    gap: 5px;
    padding: 0 5px;
    font-size: 13px;
  }

  .key-points {
    padding: 17px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-icon--loading svg {
    animation: none;
  }
}
</style>
