<script setup lang="ts">
import { FolderOpen } from '@lucide/vue'
import { onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import CloudSyncButton from '@/components/sync/CloudSyncButton.vue'
import { useCatalog } from '@/composables/useCatalog'
import { useCloudAuth } from '@/composables/useCloudAuth'

const cachedViews = ['LibraryView', 'FolderView', 'FavoritesView', 'HistoryView']
const route = useRoute()
const router = useRouter()
const { loadCatalog } = useCatalog()
const { isPasswordRecovery } = useCloudAuth()

onMounted(() => {
  void loadCatalog()
})

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
    <RouterLink class="app-brand" :to="{ name: 'library' }" aria-label="返回资料库首页">
      <span class="traffic-lights" aria-hidden="true">
        <span class="traffic-light traffic-light-red" />
        <span class="traffic-light traffic-light-yellow" />
        <span class="traffic-light traffic-light-green" />
      </span>

      <span class="brand-divider" aria-hidden="true" />

      <span class="brand-mark" aria-hidden="true">
        <FolderOpen :size="17" />
      </span>
      <span class="brand-copy">
        <strong>Folder Manager</strong>
        <small>Personal workspace</small>
      </span>
    </RouterLink>

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
  z-index: 40;
  display: flex;
  height: var(--app-toolbar-height);
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(24, 24, 27, 0.09);
  background: rgba(250, 250, 251, 0.78);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.72) inset, 0 1px 8px rgba(24, 24, 27, 0.035);
  backdrop-filter: saturate(160%) blur(24px);
  -webkit-backdrop-filter: saturate(160%) blur(24px);
}

.app-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--color-text-strong);
}

.traffic-lights {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 7px;
  padding: 0 2px;
}

.traffic-light {
  width: 11px;
  height: 11px;
  border: 1px solid rgba(24, 24, 27, 0.09);
  border-radius: 50%;
  box-shadow: 0 0.5px 1px rgba(24, 24, 27, 0.08) inset;
}

.traffic-light-red {
  background: #ff5f57;
}

.traffic-light-yellow {
  background: #febc2e;
}

.traffic-light-green {
  background: #28c840;
}

.brand-divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
}

.brand-mark {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(94, 106, 210, 0.2);
  border-radius: 9px;
  background: linear-gradient(145deg, #ffffff, #eeeeff);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(94, 106, 210, 0.12);
}

.brand-copy {
  display: grid;
  min-width: 0;
  line-height: 1.1;
}

.brand-copy strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-copy small {
  margin-top: 3px;
  color: var(--color-muted);
  font-size: 10px;
  font-weight: 520;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .app-toolbar {
    padding: 0 10px;
  }

  .traffic-lights,
  .brand-divider,
  .brand-copy small {
    display: none;
  }

  .app-brand {
    gap: 7px;
  }
}
</style>
