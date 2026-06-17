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

  <!-- PB6 AI Assistant -->
  <Teleport to="body">
    <AIAssistantButton :is-open="aiPanelOpen" @toggle="aiPanelOpen = !aiPanelOpen" />
    <AIChatPanel :visible="aiPanelOpen" @close="aiPanelOpen = false" />
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SearchPanel from '@/components/search/SearchPanel.vue'
import Toast from '@/components/common/Toast.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { usePlatformStore } from '@/stores/platformStore'
import { useKeyboard } from '@/composables/useKeyboard'
import { providerHost } from '@/provider-host'
import { featureFlagManager } from '@platform/flags'
import { aiOrchestrator } from '@/ai/orchestrator/AIOrchestrator'
import AIAssistantButton from '@/ai/ui/AIAssistantButton.vue'
import AIChatPanel from '@/ai/ui/AIChatPanel.vue'

const appStore = useAppStore()
const userStore = useUserStore()
const platformStore = usePlatformStore()
const aiPanelOpen = ref(false)

onMounted(async () => {
  await Promise.all([
    appStore.loadAppConfig(),
    userStore.loadFromStorage(),
    providerHost.initialize(),
  ])

  // PB6: AI 初始化 (Feature Flag 门控)
  try {
    await featureFlagManager.initialize()
    if (featureFlagManager.isEnabled('pb5.ai')) {
      await aiOrchestrator.initialize()
      platformStore.setAIAvailable(aiOrchestrator.isAvailable())
    }
  } catch {
    // AI 初始化失败不阻断应用
  }
})

// 全局快捷键
useKeyboard({
  'KeyK': { ctrl: true, handler: () => appStore.openSearchPanel() },
  'Escape': { handler: () => appStore.closeSearchPanel() },
  'Backslash': { ctrl: true, handler: () => appStore.toggleSidebar() }
})
</script>
