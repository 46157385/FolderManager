import { createRouter, createWebHistory } from 'vue-router'

import LibraryView from '@/views/LibraryView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.name === 'reader') {
      return { top: 0, left: 0 }
    }

    return false
  },
  routes: [
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
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/knowledge/power-seven-rules',
      name: 'knowledge-power-seven-rules',
      component: () => import('@/views/KnowledgeBaseView.vue'),
    },
  ],
})
