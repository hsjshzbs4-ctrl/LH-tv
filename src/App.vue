<!-- src/App.vue - 根组件 -->
<template>
  <AppLayout>
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <keep-alive v-if="route.meta.keepAlive">
          <component :is="Component" :key="route.path" />
        </keep-alive>
        <component :is="Component" v-else :key="route.path" />
      </transition>
    </router-view>
  </AppLayout>

  <!-- 全局搜索面板 -->
  <Teleport to="body">
    <SearchPanel
      v-if="appStore.searchPanelOpen"
      @close="appStore.closeSearchPanel()"
    />
  </Teleport>

  <!-- 全局 Toast -->
  <Teleport to="body">
    <Toast />
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SearchPanel from '@/components/search/SearchPanel.vue'
import Toast from '@/components/common/Toast.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useKeyboard } from '@/composables/useKeyboard'

const appStore = useAppStore()
const userStore = useUserStore()

onMounted(async () => {
  await Promise.all([
    appStore.loadAppConfig(),
    userStore.loadFromStorage(),
  ])
})

// 全局快捷键
useKeyboard({
  'KeyK': { ctrl: true, handler: () => appStore.openSearchPanel() },
  'Escape': { handler: () => appStore.closeSearchPanel() },
  'Backslash': { ctrl: true, handler: () => appStore.toggleSidebar() }
})
</script>
