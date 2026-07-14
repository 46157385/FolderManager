<script setup lang="ts">
import CloudSyncButton from '@/components/sync/CloudSyncButton.vue'
</script>

<template>
  <header class="app-toolbar">
    <CloudSyncButton />
  </header>

  <RouterView />
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
