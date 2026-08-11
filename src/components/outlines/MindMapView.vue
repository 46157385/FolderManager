<script setup lang="ts">
import { computed } from 'vue'

import type { OutlineNode } from '@/types/sectionOutline'

interface Props {
  root: OutlineNode
}

interface PositionedNode {
  key: string
  label: string
  fullLabel: string
  description: string
  x: number
  y: number
  width: number
  height: number
  depth: number
  hasChildren: boolean
}

interface MindMapEdge {
  key: string
  path: string
  depth: number
}

interface MindMapLayout {
  nodes: PositionedNode[]
  edges: MindMapEdge[]
  width: number
  height: number
}

const props = defineProps<Props>()

const ROOT_NODE_WIDTH = 184
const NODE_WIDTH = 164
const NODE_HEIGHT = 42
const HORIZONTAL_GAP = 76
const VERTICAL_GAP = 18
const CANVAS_PADDING = 32
const MIN_CANVAS_WIDTH = 520
const MIN_CANVAS_HEIGHT = 280

const layout = computed(() => createMindMapLayout(props.root))
const canvasTitle = computed(() => `${normalizeLabel(props.root.label)}思维导图`)

function createMindMapLayout(root: OutlineNode): MindMapLayout {
  const nodes: PositionedNode[] = []
  const edges: MindMapEdge[] = []
  const subtreeHeights = new WeakMap<OutlineNode, number>()
  const treeHeight = measureSubtree(root, subtreeHeights)
  const canvasHeight = Math.max(MIN_CANVAS_HEIGHT, treeHeight + CANVAS_PADDING * 2)
  const treeTop = (canvasHeight - treeHeight) / 2
  let furthestNodeEdge = 0

  function positionNode(
    node: OutlineNode,
    depth: number,
    subtreeTop: number,
    key: string,
    parent?: PositionedNode,
  ): PositionedNode {
    const subtreeHeight = subtreeHeights.get(node) ?? NODE_HEIGHT
    const width = depth === 0 ? ROOT_NODE_WIDTH : NODE_WIDTH
    const x = getDepthX(depth)
    const y = subtreeTop + (subtreeHeight - NODE_HEIGHT) / 2
    const fullLabel = normalizeLabel(node.label)
    const positionedNode: PositionedNode = {
      key,
      label: shortenLabel(fullLabel, depth === 0 ? 17 : 15),
      fullLabel,
      description: node.detail
        ? `${fullLabel}：${node.detail.trim()}`
        : fullLabel,
      x,
      y,
      width,
      height: NODE_HEIGHT,
      depth,
      hasChildren: node.children.length > 0,
    }

    nodes.push(positionedNode)
    furthestNodeEdge = Math.max(furthestNodeEdge, x + width)

    if (parent) {
      edges.push({
        key: `${parent.key}->${key}`,
        path: createConnectorPath(parent, positionedNode),
        depth,
      })
    }

    const childrenHeight = getChildrenHeight(node, subtreeHeights)
    let childTop = subtreeTop + (subtreeHeight - childrenHeight) / 2

    node.children.forEach((child, index) => {
      const childHeight = subtreeHeights.get(child) ?? NODE_HEIGHT
      positionNode(
        child,
        depth + 1,
        childTop,
        `${key}/${child.id}:${index}`,
        positionedNode,
      )
      childTop += childHeight + VERTICAL_GAP
    })

    return positionedNode
  }

  positionNode(root, 0, treeTop, `root:${root.id}`)

  return {
    nodes,
    edges,
    width: Math.max(MIN_CANVAS_WIDTH, furthestNodeEdge + CANVAS_PADDING),
    height: canvasHeight,
  }
}

function measureSubtree(
  node: OutlineNode,
  subtreeHeights: WeakMap<OutlineNode, number>,
): number {
  const cachedHeight = subtreeHeights.get(node)
  if (cachedHeight !== undefined) {
    return cachedHeight
  }

  const childrenHeight = node.children.reduce((total, child, index) => {
    const gap = index === 0 ? 0 : VERTICAL_GAP
    return total + gap + measureSubtree(child, subtreeHeights)
  }, 0)
  const height = Math.max(NODE_HEIGHT, childrenHeight)

  subtreeHeights.set(node, height)
  return height
}

function getChildrenHeight(
  node: OutlineNode,
  subtreeHeights: WeakMap<OutlineNode, number>,
): number {
  return node.children.reduce((total, child, index) => {
    const gap = index === 0 ? 0 : VERTICAL_GAP
    return total + gap + (subtreeHeights.get(child) ?? NODE_HEIGHT)
  }, 0)
}

function getDepthX(depth: number): number {
  if (depth === 0) {
    return CANVAS_PADDING
  }

  return CANVAS_PADDING
    + ROOT_NODE_WIDTH
    + HORIZONTAL_GAP
    + (depth - 1) * (NODE_WIDTH + HORIZONTAL_GAP)
}

function createConnectorPath(parent: PositionedNode, child: PositionedNode): string {
  const startX = parent.x + parent.width
  const startY = parent.y + parent.height / 2
  const endX = child.x
  const endY = child.y + child.height / 2
  const controlX = startX + (endX - startX) * 0.5

  return `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`
}

function normalizeLabel(label: string): string {
  return label.trim() || '未命名节点'
}

function shortenLabel(label: string, maxUnits: number): string {
  const characters = Array.from(label)
  let units = 0
  let result = ''

  for (const character of characters) {
    const characterUnits = /[\u2e80-\uffff]/u.test(character) ? 1 : 0.56
    if (units + characterUnits > maxUnits) {
      return `${result.trimEnd()}…`
    }

    result += character
    units += characterUnits
  }

  return result
}
</script>

<template>
  <div
    class="mind-map-viewport"
    role="region"
    :aria-label="canvasTitle"
    tabindex="0"
  >
    <svg
      class="mind-map-canvas"
      :width="layout.width"
      :height="layout.height"
      role="img"
      :aria-label="canvasTitle"
    >
      <title>{{ canvasTitle }}</title>

      <g class="mind-map-links" aria-hidden="true">
        <path
          v-for="edge in layout.edges"
          :key="edge.key"
          class="mind-map-edge"
          :class="{ 'mind-map-edge--primary': edge.depth === 1 }"
          :d="edge.path"
        />
      </g>

      <g class="mind-map-nodes" role="list">
        <g
          v-for="node in layout.nodes"
          :key="node.key"
          class="mind-map-node"
          :class="{
            'mind-map-node--root': node.depth === 0,
            'mind-map-node--branch': node.depth > 0 && node.hasChildren,
          }"
          role="listitem"
          :aria-label="node.description"
          :transform="`translate(${node.x} ${node.y})`"
        >
          <title>{{ node.description }}</title>
          <rect
            class="mind-map-node-shape"
            :width="node.width"
            :height="node.height"
            rx="10"
          />
          <text
            class="mind-map-node-label"
            :x="node.width / 2"
            :y="node.height / 2"
            text-anchor="middle"
            dominant-baseline="central"
          >
            {{ node.label }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.mind-map-viewport {
  width: 100%;
  height: clamp(320px, 56vh, 600px);
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  outline: none;
  background-color: var(--color-bg-elevated);
  background-image: radial-gradient(circle, rgba(102, 112, 133, 0.16) 1px, transparent 1px);
  background-size: 18px 18px;
  overscroll-behavior: contain;
  scrollbar-color: var(--color-border-strong) transparent;
  -webkit-overflow-scrolling: touch;
}

.mind-map-viewport:focus-visible {
  border-color: rgba(94, 106, 210, 0.42);
  box-shadow: 0 0 0 4px rgba(94, 106, 210, 0.09);
}

.mind-map-canvas {
  display: block;
  min-width: 100%;
  min-height: 100%;
}

.mind-map-edge {
  fill: none;
  stroke: var(--color-border-strong);
  stroke-linecap: round;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.mind-map-edge--primary {
  stroke: rgba(94, 106, 210, 0.5);
  stroke-width: 2;
}

.mind-map-node-shape {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.mind-map-node--branch .mind-map-node-shape {
  fill: var(--color-primary-soft);
  stroke: rgba(94, 106, 210, 0.3);
}

.mind-map-node--root .mind-map-node-shape {
  fill: var(--color-primary);
  stroke: var(--color-primary-strong);
  stroke-width: 1.5;
}

.mind-map-node-label {
  fill: var(--color-text-strong);
  font-family: inherit;
  font-size: 13px;
  font-weight: 570;
  letter-spacing: 0.01em;
  pointer-events: none;
  user-select: none;
}

.mind-map-node--branch .mind-map-node-label {
  fill: var(--color-primary-strong);
  font-weight: 620;
}

.mind-map-node--root .mind-map-node-label {
  fill: #ffffff;
  font-size: 14px;
  font-weight: 650;
}

@media (max-width: 640px) {
  .mind-map-viewport {
    height: min(52vh, 480px);
    min-height: 300px;
    border-radius: var(--radius-md);
  }
}
</style>
