// src/stores/app.ts - 全局应用状态
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppConfig } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 侧边栏
  const sidebarCollapsed = ref(false)
  const sidebarHovered = ref(false)

  const sidebarEffective = computed(() => {
    if (!sidebarCollapsed.value) return 'expanded'
    if (sidebarHovered.value) return 'expanded'
    return 'collapsed'
  })

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    sidebarHovered.value = false
  }

  // 全局搜索面板
  const searchPanelOpen = ref(false)

  function openSearchPanel() {
    searchPanelOpen.value = true
  }

  function closeSearchPanel() {
    searchPanelOpen.value = false
  }

  // 窗口最大化状态
  const isMaximized = ref(false)

  // 应用配置
  const appConfig = ref<AppConfig | null>(null)

  async function loadAppConfig() {
    try {
      appConfig.value = await window.app.getAppConfig()
    } catch {
      console.warn('加载应用配置失败')
    }
  }

  return {
    sidebarCollapsed,
    sidebarHovered,
    sidebarEffective,
    toggleSidebar,
    searchPanelOpen,
    openSearchPanel,
    closeSearchPanel,
    isMaximized,
    appConfig,
    loadAppConfig
  }
})
