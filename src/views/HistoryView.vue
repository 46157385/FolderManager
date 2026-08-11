<script setup lang="ts">
import { ArrowLeft, Clock } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import LearningStatusBadge from '@/components/learning/LearningStatusBadge.vue'
import CatalogStatePanel from '@/components/materials/CatalogStatePanel.vue'
import { useCatalog } from '@/composables/useCatalog'
import { useLearningStatus } from '@/composables/useLearningStatus'
import { useScrollPosition } from '@/composables/useScrollPosition'
import { useViewHistory } from '@/composables/useViewHistory'
import { getMaterialTitle } from '@/utils/materialTitle'

defineOptions({ name: 'HistoryView' })

const router = useRouter()
const { materialById, isLoading, isLoaded, errorMessage, loadCatalog } = useCatalog()
const { getLearningStatus } = useLearningStatus()
const { recentHistory } = useViewHistory()
const { saveScrollPosition } = useScrollPosition()

const catalogLoading = computed(() => {
  return isLoading.value || (!isLoaded.value && !errorMessage.value)
})
const historyRows = computed(() => {
  return recentHistory.value.map((record) => {
    const material = materialById.value.get(record.materialId)

    return {
      ...record,
      materialName: material ? getMaterialTitle(material) : record.materialName,
      viewedAtLabel: new Date(record.viewedAt).toLocaleString(),
      learningStatus: getLearningStatus(record.materialId),
    }
  })
})

function openMaterial(materialId: string) {
  saveScrollPosition()
  router.push({ name: 'reader', params: { id: materialId } })
}

function retryCatalog() {
  void loadCatalog(true)
}
</script>

<template>
  <main class="page">
    <section class="history-shell">
      <header class="history-header">
        <RouterLink class="back-link" :to="{ name: 'library' }" title="返回列表" aria-label="返回列表">
          <ArrowLeft :size="19" />
        </RouterLink>

        <div class="title-wrap">
          <p class="eyebrow">History</p>
          <h1 class="title">最近一个月</h1>
          <p class="description">最近一个月共 {{ historyRows.length }} 条阅读记录。</p>
        </div>
      </header>

      <CatalogStatePanel
        v-if="catalogLoading || errorMessage"
        :loading="catalogLoading"
        :error-message="errorMessage"
        @retry="retryCatalog"
      />

      <section v-else-if="historyRows.length === 0" class="empty-state">
        <span class="empty-icon">
          <Clock :size="22" />
        </span>
        <p class="empty-title">暂无历史记录</p>
        <p class="empty-text">最近一个月打开的资料会显示在这里。</p>
      </section>

      <section v-else class="history-list">
        <button
          v-for="record in historyRows"
          :key="record.id"
          class="history-row"
          type="button"
          @click="openMaterial(record.materialId)"
        >
          <span class="record-icon">
            <Clock :size="18" />
          </span>
          <span class="record-main">
            <span class="record-title">{{ record.materialName }}</span>
            <time class="record-time">{{ record.viewedAtLabel }}</time>
          </span>
          <LearningStatusBadge :status="record.learningStatus" />
        </button>
      </section>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.history-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 44px 0 96px;
}

.history-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 22px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.back-link {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-muted-strong);
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
}

.back-link:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.title-wrap {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 9px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 36px;
  font-weight: 720;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.description {
  margin: 12px 0 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.65;
}

.history-list {
  display: grid;
  gap: 12px;
}

.empty-state {
  display: grid;
  justify-items: center;
  padding: 56px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  text-align: center;
  box-shadow: var(--shadow-panel);
}

.empty-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
  color: var(--color-primary);
}

.empty-title {
  margin: 16px 0 6px;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 620;
}

.empty-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.6;
}

.history-row {
  display: grid;
  width: 100%;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  min-height: 68px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-glass);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(16px);
}

.history-row:hover {
  border-color: var(--color-border-strong);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-soft);
  transform: translateY(-1px);
}

.record-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
  color: var(--color-primary);
}

.record-main {
  min-width: 0;
}

.record-title,
.record-time {
  display: block;
}

.record-title {
  color: var(--color-text-strong);
  font-weight: 560;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.record-time {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 13px;
}

@media (max-width: 520px) {
  .history-row {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .history-row :deep(.status-badge) {
    grid-column: 2;
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .history-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 24px 0 56px;
  }

  .history-header {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 14px;
    padding: 20px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
