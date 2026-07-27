import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import './styles/main.css'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createApp(App).use(router).mount('#app')
