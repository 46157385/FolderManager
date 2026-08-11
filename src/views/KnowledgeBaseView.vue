<script setup lang="ts">
import KnowledgeChatPanel from '@/components/knowledge/KnowledgeChatPanel.vue'

const POWER_SEVEN_RULES_ID = 'power-seven-rules'
</script>

<template>
  <main class="knowledge-page">
    <KnowledgeChatPanel :knowledge-base-id="POWER_SEVEN_RULES_ID" />
  </main>
</template>

<style scoped>
.knowledge-page {
  min-height: calc(100vh - var(--app-toolbar-height));
  color: var(--color-text);
}
</style>
