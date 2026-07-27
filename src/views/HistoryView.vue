<script setup lang="ts">
import { ArrowLeft, Clock } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useScrollPosition } from '@/composables/useScrollPosition'
import { useViewHistory } from '@/composables/useViewHistory'
import { materials } from '@/data/materials'
import { getMaterialTitle } from '@/utils/materialTitle'

defineOptions({ name: 'HistoryView' })

const router = useRouter()
const { recentHistory } = useViewHistory()
const { saveScrollPosition } = useScrollPosition()

const historyRows = computed(() => {
  const materialMap = new Map(materials.map((material) => [material.id, material]))

  return recentHistory.value.map((record) => ({
    ...record,
    materialName: materialMap.has(record.materialId)
      ? getMaterialTitle(materialMap.get(record.materialId)!)
      : record.materialName,
    viewedAtLabel: new Date(record.viewedAt).toLocaleString(),
  }))
})

function openMaterial(materialId: string) {
  saveScrollPosition()
  router.push({ name: 'reader', params: { id: materialId } })
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

      <section v-if="historyRows.length === 0" class="empty-state">
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
        </button>
      </section>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.history-shell {
  width: min(var(--shell-width), calc(100% - 48px));
  margin: 0 auto;
  padding: 56px 0 96px;
}

.history-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.back-link {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-muted-strong);
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
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
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 38px;
  font-weight: 680;
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
  background: var(--color-surface);
  text-align: center;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
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
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  min-height: 68px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
}

.history-row:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
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

@media (max-width: 640px) {
  .history-shell {
    width: min(100% - 24px, var(--shell-width));
    padding: 32px 0 56px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
