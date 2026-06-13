<!-- src/components/layout/AppTitleBar.vue - 自定义标题栏 -->
<template>
  <header class="titlebar" @dblclick="onMaximize">
    <div class="titlebar-left">
      <span class="titlebar-logo">🎬 LH</span>
    </div>

    <div class="titlebar-center drag-region">
      <span class="titlebar-hint">Ctrl+K 搜索</span>
    </div>

    <div class="titlebar-right">
      <button class="titlebar-btn" @click="onMinimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="5.5" width="10" height="1" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-btn" @click="onMaximize" :title="isMax ? '还原' : '最大化'">
        <svg v-if="!isMax" width="12" height="12" viewBox="0 0 12 12">
          <rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <rect x="3" y="0.5" width="8.5" height="8.5" stroke="currentColor" stroke-width="1" fill="none"/>
          <rect x="0.5" y="3" width="8.5" height="8.5" stroke="currentColor" stroke-width="1" fill="var(--color-bg-base)"/>
        </svg>
      </button>
      <button class="titlebar-btn titlebar-close" @click="onClose" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5"/>
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isMax = ref(false)

onMounted(async () => {
  try {
    isMax.value = await window.app.isMaximized()
  } catch { /* ignore */ }
})

async function onMinimize() {
  window.app.minimizeWindow()
}

async function onMaximize() {
  try {
    isMax.value = await window.app.maximizeWindow()
  } catch { /* ignore */ }
}

function onClose() {
  window.app.closeWindow()
}
</script>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  height: var(--titlebar-height);
  background: var(--color-bg-base);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  z-index: var(--z-titlebar);
}

.titlebar-left {
  display: flex;
  align-items: center;
  padding-left: var(--space-md);
  min-width: var(--sidebar-width);
  transition: min-width var(--duration-normal) var(--ease-in-out);
}

.titlebar-logo {
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  color: var(--color-accent);
  letter-spacing: -0.5px;
}

.titlebar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  -webkit-app-region: drag;
  height: 100%;
}

.titlebar-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  align-self: center;
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 4px;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 36px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  color: var(--color-text-secondary);
  transition: background var(--duration-fast) var(--ease-out);
}

.titlebar-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.titlebar-close:hover {
  background: var(--color-danger);
  color: #fff;
}
</style>
