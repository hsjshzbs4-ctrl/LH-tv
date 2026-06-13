<!-- src/components/layout/AppLayout.vue - 布局容器 -->
<template>
  <div class="app-shell">
    <AppTitleBar />
    <div class="app-body">
      <AppSidebar />
      <main class="app-content" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppTitleBar from './AppTitleBar.vue'
import AppSidebar from './AppSidebar.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-lg) var(--space-xl);
  margin-left: var(--sidebar-width);
  transition: margin-left var(--duration-normal) var(--ease-in-out);
}

.app-content.sidebar-collapsed {
  margin-left: var(--sidebar-collapsed);
}

/* 滚动条在内容区 */
.app-content::-webkit-scrollbar {
  width: 6px;
}

.app-content::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}
</style>
