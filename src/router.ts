import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { isCloudSyncEnabled, isKnowledgeBaseEnabled } from '@/config/features'
import LibraryView from '@/views/LibraryView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'library',
    component: LibraryView,
  },
  {
    path: '/folders/:id',
    name: 'folder',
    component: () => import('@/views/FolderView.vue'),
    props: true,
  },
  {
    path: '/reader/:id',
    name: 'reader',
    component: () => import('@/views/ReaderView.vue'),
    props: true,
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/FavoritesView.vue'),
  },
  ...(isCloudSyncEnabled
    ? [{
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
      } satisfies RouteRecordRaw]
    : []),
  ...(isKnowledgeBaseEnabled
    ? [{
        path: '/knowledge/power-seven-rules',
        name: 'knowledge-power-seven-rules',
        component: () => import('@/views/KnowledgeBaseView.vue'),
      } satisfies RouteRecordRaw]
    : []),
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'library' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.name === 'reader') {
      return { top: 0, left: 0 }
    }

    return false
  },
  routes,
})
