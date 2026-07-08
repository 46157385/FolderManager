import { createRouter, createWebHistory } from 'vue-router'

import FavoritesView from '@/views/FavoritesView.vue'
import FolderView from '@/views/FolderView.vue'
import HistoryView from '@/views/HistoryView.vue'
import LibraryView from '@/views/LibraryView.vue'
import LoginView from '@/views/LoginView.vue'
import ReaderView from '@/views/ReaderView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'library',
      component: LibraryView,
    },
    {
      path: '/folders/:id',
      name: 'folder',
      component: FolderView,
      props: true,
    },
    {
      path: '/reader/:id',
      name: 'reader',
      component: ReaderView,
      props: true,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})
