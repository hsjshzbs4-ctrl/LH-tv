// src/main.ts - Vue 应用入口
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import './styles/variables.css'
import './styles/reset.css'
import './styles/transitions.css'
import './styles/utilities.css'

const app = createApp(App)

// Pinia 状态管理 + 持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.mount('#app')
