<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CloudSyncButton from '@/components/sync/CloudSyncButton.vue'
import { useCloudAuth } from '@/composables/useCloudAuth'

const cachedViews = ['LibraryView', 'FolderView', 'FavoritesView', 'HistoryView']
const route = useRoute()
const router = useRouter()
const { isPasswordRecovery } = useCloudAuth()

watch(
  isPasswordRecovery,
  async (isRecovering) => {
    if (
      isRecovering
      && (route.name !== 'login' || route.query.mode !== 'reset-password')
    ) {
      await router.replace({
        name: 'login',
        query: { mode: 'reset-password' },
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <header class="app-toolbar">
    <CloudSyncButton />
  </header>

  <RouterView v-slot="{ Component, route }">
    <KeepAlive :include="cachedViews" :max="8">
      <component :is="Component" :key="route.fullPath" />
    </KeepAlive>
  </RouterView>
</template>

<style scoped>
.app-toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  height: var(--app-toolbar-height);
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  border-bottom: 1px solid rgba(228, 231, 236, 0.86);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
  backdrop-filter: blur(18px);
}

@media (max-width: 640px) {
  .app-toolbar {
    padding: 0 10px;
  }
}
</style>
