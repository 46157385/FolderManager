<script setup lang="ts">
import type { OutlineNode } from '@/types/sectionOutline'

interface Props {
  node: OutlineNode
}

const props = defineProps<Props>()
</script>

<template>
  <ul class="outline-tree">
    <li class="outline-tree-item">
      <div class="outline-node">
        <span class="outline-marker" aria-hidden="true" />

        <div class="outline-content">
          <div class="outline-label">{{ props.node.label }}</div>
          <p v-if="props.node.detail" class="outline-detail">{{ props.node.detail }}</p>
        </div>
      </div>

      <div v-if="props.node.children.length > 0" class="outline-children">
        <OutlineTree
          v-for="child in props.node.children"
          :key="child.id"
          :node="child"
        />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.outline-tree {
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.outline-tree-item {
  min-width: 0;
}

.outline-node {
  display: grid;
  min-width: 0;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.outline-marker {
  width: 7px;
  height: 7px;
  margin-top: 7px;
  border: 2px solid var(--color-primary);
  border-radius: 999px;
  background: var(--color-surface);
}

.outline-content {
  min-width: 0;
}

.outline-label {
  color: var(--color-text-strong);
  font-size: 14px;
  font-weight: 620;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.outline-detail {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.outline-children {
  position: relative;
  display: grid;
  gap: 2px;
  margin: 2px 0 0 14px;
  padding-left: 18px;
}

.outline-children::before {
  position: absolute;
  top: 0;
  bottom: 12px;
  left: 3px;
  width: 1px;
  background: var(--color-border);
  content: "";
}

.outline-children :deep(.outline-marker) {
  width: 6px;
  height: 6px;
  border-color: var(--color-border-strong);
  background: var(--color-surface);
}

@media (max-width: 640px) {
  .outline-node {
    padding-right: 4px;
    padding-left: 6px;
  }

  .outline-children {
    margin-left: 8px;
    padding-left: 14px;
  }
}
</style>
